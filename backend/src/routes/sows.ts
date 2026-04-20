import { Router } from 'express';
import { db } from '../lib/db.js';
import { notFound, badRequest } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import {
  createSOWSchema,
  updateSOWSchema,
  calculateMarginSchema,
  approveSchema,
  rejectSchema,
} from '../schemas/sowSchemas.js';
import {
  createSOWDraft,
  calculateMargin,
  submitForApproval,
  approveSOW,
  rejectSOW,
} from '../services/sowEngine.js';
import { getAutoInjectClauses } from '../services/legalApprovals.js';

const router = Router();
router.use(verifyJWT);

/**
 * POST /api/sows
 * Create a new SOW draft. Auto-populates customer/MSA data.
 */
router.post(
  '/',
  requirePermission('sow:create'),
  validateBody(createSOWSchema),
  asyncHandler(async (req, res) => {
    const result = await createSOWDraft({
      ...req.body,
      createdBy: req.user!.email,
    });
    res.status(201).json(result);
  })
);

/**
 * GET /api/sows
 * List SOWs with optional filters: ?status=draft, ?customerId=C001
 */
router.get(
  '/',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    let query = db('sows')
      .select('sows.*', 'customers.name as customer_name')
      .join('customers', 'sows.customer_id', 'customers.id')
      .orderBy('sows.created_at', 'desc');

    if (req.query.status) query = query.where('sows.status', req.query.status as string);
    if (req.query.customerId) query = query.where('sows.customer_id', req.query.customerId as string);

    const sows = await query;
    res.json(sows);
  })
);

/**
 * GET /api/sows/:id
 * Get single SOW with resource lines, customer, and legal clause info.
 */
router.get(
  '/:id',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const sow = await db('sows')
      .select('sows.*', 'customers.name as customer_name')
      .join('customers', 'sows.customer_id', 'customers.id')
      .where('sows.id', req.params.id as string)
      .first();

    if (!sow) throw notFound(`SOW ${req.params.id as string} not found`);

    const resourceLines = await db('sow_resource_lines as srl')
      .select('srl.*', 'roles.title as role_title', 'locations.name as location_name')
      .leftJoin('roles', 'srl.role_id', 'roles.id')
      .leftJoin('locations', 'srl.location_id', 'locations.id')
      .where('srl.sow_id', req.params.id as string);

    // Strip FLC from resource lines if user can't see it
    const canReadFlc = req.user!.permissions.includes('flc:read');
    const lines = resourceLines.map((line) => {
      if (!canReadFlc) {
        const { flc_rate, line_cost, ...rest } = line;
        return rest;
      }
      return line;
    });

    // Get legal clause categorization
    const clauseInfo = getAutoInjectClauses(
      sow.type as 'lean_tm' | 'elaborate_tm' | 'fixed_fee',
      sow.customer_id
    );

    // Parse form_data
    const formData = typeof sow.form_data === 'string' ? JSON.parse(sow.form_data) : sow.form_data;

    res.json({
      ...sow,
      form_data: formData,
      resourceLines: lines,
      legalClauses: {
        autoInject: clauseInfo.autoInject.map((c) => c.title),
        manualReview: clauseInfo.manualReview.map((c) => c.title),
        blocked: clauseInfo.blocked.map((c) => c.title),
      },
    });
  })
);

/**
 * PUT /api/sows/:id
 * Update SOW draft (save wizard progress).
 */
router.put(
  '/:id',
  requirePermission('sow:update'),
  validateBody(updateSOWSchema),
  asyncHandler(async (req, res) => {
    const sow = await db('sows').where('id', req.params.id as string).first();
    if (!sow) throw notFound(`SOW ${req.params.id as string} not found`);
    if (sow.status !== 'draft') throw badRequest('Can only update SOWs in draft status');

    const updates: any = { updated_at: new Date().toISOString() };
    if (req.body.title) updates.title = req.body.title;
    if (req.body.startDate) updates.start_date = req.body.startDate;
    if (req.body.endDate) updates.end_date = req.body.endDate;
    if (req.body.formData) {
      const existing = typeof sow.form_data === 'string' ? JSON.parse(sow.form_data) : sow.form_data;
      updates.form_data = JSON.stringify({ ...existing, ...req.body.formData });
    }

    await db('sows').where('id', req.params.id as string).update(updates);
    const updated = await db('sows').where('id', req.params.id as string).first();
    res.json(updated);
  })
);

/**
 * POST /api/sows/:id/calculate-margin
 * Real-time margin calculation from resource lines.
 */
router.post(
  '/:id/calculate-margin',
  requirePermission('sow:create'),
  validateBody(calculateMarginSchema),
  asyncHandler(async (req, res) => {
    const sow = await db('sows').where('id', req.params.id as string).first();
    if (!sow) throw notFound(`SOW ${req.params.id as string} not found`);

    const result = await calculateMargin(req.body.resourceLines);

    // Strip FLC details if user can't see them
    const canReadFlc = req.user!.permissions.includes('flc:read');
    if (!canReadFlc) {
      result.totalCost = 0;
      result.perResource = result.perResource.map(({ flcRate, cost, ...rest }) => ({
        ...rest,
        flcRate: 0,
        cost: 0,
      }));
    }

    res.json(result);
  })
);

/**
 * POST /api/sows/:id/submit
 * Submit SOW for approval. Requires resource lines in body.
 */
router.post(
  '/:id/submit',
  requirePermission('sow:create'),
  validateBody(calculateMarginSchema), // same shape — needs resource lines
  asyncHandler(async (req, res) => {
    const result = await submitForApproval(
      req.params.id as string,
      req.body.resourceLines,
      req.user!.email
    );
    res.json(result);
  })
);

/**
 * POST /api/sows/:id/approve
 * Approve a pending SOW.
 */
router.post(
  '/:id/approve',
  requirePermission('sow:approve'),
  validateBody(approveSchema),
  asyncHandler(async (req, res) => {
    const result = await approveSOW(req.params.id as string, req.user!.email, req.body.comments);
    res.json(result);
  })
);

/**
 * POST /api/sows/:id/reject
 * Reject a pending SOW with comments.
 */
router.post(
  '/:id/reject',
  requirePermission('sow:approve'),
  validateBody(rejectSchema),
  asyncHandler(async (req, res) => {
    const result = await rejectSOW(req.params.id as string, req.user!.email, req.body.comments);
    res.json(result);
  })
);

export default router;
