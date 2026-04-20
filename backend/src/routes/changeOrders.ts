import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../lib/db.js';
import { notFound, badRequest } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import {
  createChangeOrderSchema,
  approveChangeOrderSchema,
  rejectChangeOrderSchema,
} from '../schemas/changeOrderSchemas.js';
import { MARGIN_FORMULAS, getApprovalLevel } from '../services/financeRules.js';
import { submitChangeOrderForApproval } from '../services/workflowQueue.js';

const router = Router();
router.use(verifyJWT);

/**
 * POST /api/change-orders
 * Create a change order with addition/credit lines. Auto-calculates financial impact.
 */
router.post(
  '/',
  requirePermission('change_order:create'),
  validateBody(createChangeOrderSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;

    // Verify SOW exists and is active
    const sow = await db('sows').where('id', data.sowId).first();
    if (!sow) throw notFound(`SOW ${data.sowId} not found`);
    if (!['active', 'approved', 'signed'].includes(sow.status)) {
      throw badRequest(`SOW ${data.sowId} is not in an active state (current: ${sow.status})`);
    }

    // Calculate financial impact
    const impact = MARGIN_FORMULAS.changeOrderImpact(
      data.additions.map((a: any) => ({ hours: a.hours, billRate: a.billRate })),
      data.credits.map((c: any) => ({ hours: c.hours, billRate: c.billRate }))
    );

    const changeOrderId = `CO-${nanoid(6).toUpperCase()}`;

    // Insert change order
    await db('change_orders').insert({
      id: changeOrderId,
      sow_id: data.sowId,
      type: data.type,
      description: data.description,
      additions_total: impact.additionsTotal,
      credits_total: impact.creditsTotal,
      net_impact: impact.netImpact,
      status: 'draft',
      created_by: req.user!.email,
    });

    // Insert line items
    for (const line of data.additions) {
      await db('change_order_lines').insert({
        change_order_id: changeOrderId,
        line_type: 'addition',
        resource_id: line.resourceId ?? null,
        role_id: line.roleId ?? null,
        hours: line.hours,
        bill_rate: line.billRate,
        line_total: Math.round(line.hours * line.billRate * 100) / 100,
      });
    }
    for (const line of data.credits) {
      await db('change_order_lines').insert({
        change_order_id: changeOrderId,
        line_type: 'credit',
        resource_id: line.resourceId ?? null,
        role_id: line.roleId ?? null,
        hours: line.hours,
        bill_rate: line.billRate,
        line_total: Math.round(line.hours * line.billRate * 100) / 100,
      });
    }

    // Audit log
    await db('audit_log').insert({
      entity_type: 'change_order',
      entity_id: changeOrderId,
      action: 'create',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({ sowId: data.sowId, type: data.type, ...impact }),
    });

    // Calculate updated SOW value
    const originalValue = parseFloat(sow.total_value);
    const updatedValue = Math.round((originalValue + impact.netImpact) * 100) / 100;

    res.status(201).json({
      id: changeOrderId,
      sowId: data.sowId,
      type: data.type,
      description: data.description,
      additionsTotal: impact.additionsTotal,
      creditsTotal: impact.creditsTotal,
      netImpact: impact.netImpact,
      originalSOWValue: originalValue,
      updatedSOWValue: updatedValue,
      status: 'draft',
    });
  })
);

/**
 * GET /api/change-orders
 * List change orders. Filters: ?sowId, ?status
 */
router.get(
  '/',
  requirePermission('change_order:read'),
  asyncHandler(async (req, res) => {
    let query = db('change_orders as co')
      .select('co.*', 'sows.title as sow_title', 'customers.name as customer_name')
      .join('sows', 'co.sow_id', 'sows.id')
      .join('customers', 'sows.customer_id', 'customers.id')
      .orderBy('co.created_at', 'desc');

    if (req.query.sowId) query = query.where('co.sow_id', req.query.sowId as string);
    if (req.query.status) query = query.where('co.status', req.query.status as string);

    const changeOrders = await query;
    res.json(changeOrders);
  })
);

/**
 * GET /api/change-orders/:id
 * Get change order detail with line items.
 */
router.get(
  '/:id',
  requirePermission('change_order:read'),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;

    const co = await db('change_orders as co')
      .select('co.*', 'sows.title as sow_title', 'sows.total_value as sow_total_value', 'customers.name as customer_name')
      .join('sows', 'co.sow_id', 'sows.id')
      .join('customers', 'sows.customer_id', 'customers.id')
      .where('co.id', id)
      .first();

    if (!co) throw notFound(`Change order ${id} not found`);

    const lines = await db('change_order_lines as col')
      .select('col.*', 'resources.name as resource_name', 'roles.title as role_title')
      .leftJoin('resources', 'col.resource_id', 'resources.id')
      .leftJoin('roles', 'col.role_id', 'roles.id')
      .where('col.change_order_id', id)
      .orderBy('col.line_type');

    const additions = lines.filter((l: any) => l.line_type === 'addition');
    const credits = lines.filter((l: any) => l.line_type === 'credit');

    res.json({
      ...co,
      additions,
      credits,
      updatedSOWValue: Math.round((parseFloat(co.sow_total_value) + parseFloat(co.net_impact)) * 100) / 100,
    });
  })
);

/**
 * POST /api/change-orders/:id/submit
 * Submit change order for approval.
 */
router.post(
  '/:id/submit',
  requirePermission('change_order:create'),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;

    const co = await db('change_orders').where('id', id).first();
    if (!co) throw notFound(`Change order ${id} not found`);
    if (co.status !== 'draft') throw badRequest('Can only submit draft change orders');

    // Get SOW to recalculate margin with change impact
    const sow = await db('sows').where('id', co.sow_id).first();
    const originalValue = parseFloat(sow.total_value);
    const updatedValue = originalValue + parseFloat(co.net_impact);

    // Determine approval level based on the net impact magnitude
    // Use the same margin thresholds — recalculate margin on updated SOW
    const operatingMargin = parseFloat(sow.operating_margin_percent);
    const approvalLevel = getApprovalLevel(operatingMargin);

    await db('change_orders').where('id', id).update({
      status: 'pending_approval',
      updated_at: new Date().toISOString(),
    });

    // Queue approval job
    await submitChangeOrderForApproval({
      changeOrderId: id,
      sowId: co.sow_id,
      netImpact: parseFloat(co.net_impact),
      approvers: approvalLevel.approvers,
      currentApproverIndex: 0,
      submittedBy: req.user!.email,
    });

    await db('audit_log').insert({
      entity_type: 'change_order',
      entity_id: id,
      action: 'submit',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({ status: 'pending_approval', approvers: approvalLevel.approvers }),
    });

    res.json({
      id,
      status: 'pending_approval',
      approvalLevel: approvalLevel.approvalLevel,
      approvers: approvalLevel.approvers,
    });
  })
);

/**
 * POST /api/change-orders/:id/approve
 * Approve change order — automatically updates SOW total_value.
 */
router.post(
  '/:id/approve',
  requirePermission('change_order:approve'),
  validateBody(approveChangeOrderSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;

    const co = await db('change_orders').where('id', id).first();
    if (!co) throw notFound(`Change order ${id} not found`);
    if (co.status !== 'pending_approval') throw badRequest('Change order is not pending approval');

    // Update change order status
    await db('change_orders').where('id', id).update({
      status: 'approved',
      approved_by: req.user!.email,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update SOW total value
    const sow = await db('sows').where('id', co.sow_id).first();
    const originalValue = parseFloat(sow.total_value);
    const netImpact = parseFloat(co.net_impact);
    const updatedValue = Math.round((originalValue + netImpact) * 100) / 100;

    await db('sows').where('id', co.sow_id).update({
      total_value: updatedValue,
      updated_at: new Date().toISOString(),
    });

    // Audit log
    await db('audit_log').insert({
      entity_type: 'change_order',
      entity_id: id,
      action: 'approve',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({
        status: 'approved',
        sowId: co.sow_id,
        originalSOWValue: originalValue,
        netImpact,
        updatedSOWValue: updatedValue,
        comments: req.body.comments,
      }),
    });

    res.json({
      id,
      status: 'approved',
      approvedBy: req.user!.email,
      sowId: co.sow_id,
      originalSOWValue: originalValue,
      netImpact,
      updatedSOWValue: updatedValue,
    });
  })
);

/**
 * POST /api/change-orders/:id/reject
 * Reject change order with comments.
 */
router.post(
  '/:id/reject',
  requirePermission('change_order:approve'),
  validateBody(rejectChangeOrderSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;

    const co = await db('change_orders').where('id', id).first();
    if (!co) throw notFound(`Change order ${id} not found`);
    if (co.status !== 'pending_approval') throw badRequest('Change order is not pending approval');

    await db('change_orders').where('id', id).update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    });

    await db('audit_log').insert({
      entity_type: 'change_order',
      entity_id: id,
      action: 'reject',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({ status: 'draft', comments: req.body.comments }),
    });

    res.json({
      id,
      status: 'draft',
      rejectedBy: req.user!.email,
      comments: req.body.comments,
    });
  })
);

export default router;
