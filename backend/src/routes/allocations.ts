import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { notFound, badRequest } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import { nanoid } from 'nanoid';

const router = Router();
router.use(verifyJWT);

const createAllocationSchema = z.object({
  resourceId: z.string().min(1),
  projectId: z.string().min(1),
  roleId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  allocationPercent: z.number().int().min(1).max(100),
  billRate: z.number().positive(),
  type: z.enum(['baseline', 'execution']).default('execution'),
});

const updateAllocationSchema = z.object({
  allocationPercent: z.number().int().min(1).max(100).optional(),
  endDate: z.string().optional(),
  billRate: z.number().positive().optional(),
});

/**
 * GET /api/allocations
 * List allocations. Filters: ?resourceId, ?projectId, ?type
 */
router.get(
  '/',
  requirePermission('capacity:read'),
  asyncHandler(async (req, res) => {
    let query = db('resource_allocations as ra')
      .select('ra.*', 'resources.name as resource_name', 'projects.name as project_name', 'roles.title as role_title')
      .join('resources', 'ra.resource_id', 'resources.id')
      .join('projects', 'ra.project_id', 'projects.id')
      .leftJoin('roles', 'ra.role_id', 'roles.id')
      .orderBy('ra.start_date');

    if (req.query.resourceId) query = query.where('ra.resource_id', req.query.resourceId as string);
    if (req.query.projectId) query = query.where('ra.project_id', req.query.projectId as string);
    if (req.query.type) query = query.where('ra.type', req.query.type as string);

    const allocations = await query;
    res.json(allocations);
  })
);

/**
 * POST /api/allocations
 * Create a new resource allocation.
 */
router.post(
  '/',
  requirePermission('resource_plan:create'),
  validateBody(createAllocationSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;

    // Verify resource and project exist
    const resource = await db('resources').where('id', data.resourceId).first();
    if (!resource) throw notFound(`Resource ${data.resourceId} not found`);

    const project = await db('projects').where('id', data.projectId).first();
    if (!project) throw notFound(`Project ${data.projectId} not found`);

    // Check capacity — warn but don't block
    const existing = await db('resource_allocations')
      .where('resource_id', data.resourceId)
      .andWhere('start_date', '<=', data.endDate)
      .andWhere('end_date', '>=', data.startDate);

    const totalExisting = existing.reduce((sum: number, a: any) => sum + a.allocation_percent, 0);
    const capacityWarning = totalExisting + data.allocationPercent > 100
      ? `Resource will be at ${totalExisting + data.allocationPercent}% allocation (over-allocated)`
      : null;

    const id = `RA-${nanoid(6).toUpperCase()}`;
    await db('resource_allocations').insert({
      id,
      resource_id: data.resourceId,
      project_id: data.projectId,
      role_id: data.roleId,
      start_date: data.startDate,
      end_date: data.endDate,
      allocation_percent: data.allocationPercent,
      bill_rate: data.billRate,
      type: data.type,
    });

    const allocation = await db('resource_allocations').where('id', id).first();
    res.status(201).json({ ...allocation, capacityWarning });
  })
);

/**
 * PUT /api/allocations/:id
 * Update an allocation. Baseline allocations cannot be updated.
 */
router.put(
  '/:id',
  requirePermission('resource_plan:update'),
  validateBody(updateAllocationSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const allocation = await db('resource_allocations').where('id', id).first();
    if (!allocation) throw notFound(`Allocation ${id} not found`);

    if (allocation.type === 'baseline') {
      throw badRequest('Cannot update baseline allocations — they are locked after SOW signing');
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (req.body.allocationPercent !== undefined) updates.allocation_percent = req.body.allocationPercent;
    if (req.body.endDate) updates.end_date = req.body.endDate;
    if (req.body.billRate !== undefined) updates.bill_rate = req.body.billRate;

    await db('resource_allocations').where('id', id).update(updates);
    const updated = await db('resource_allocations').where('id', id).first();
    res.json(updated);
  })
);

/**
 * POST /api/allocations/:id/lock
 * Lock an execution allocation as baseline (immutable).
 */
router.post(
  '/:id/lock',
  requirePermission('resource_plan:update'),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const allocation = await db('resource_allocations').where('id', id).first();
    if (!allocation) throw notFound(`Allocation ${id} not found`);

    if (allocation.type === 'baseline') {
      throw badRequest('Allocation is already locked as baseline');
    }

    await db('resource_allocations').where('id', id).update({ type: 'baseline', updated_at: new Date().toISOString() });

    await db('audit_log').insert({
      entity_type: 'resource_allocation',
      entity_id: id,
      action: 'lock_baseline',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({ type: 'baseline' }),
    });

    const updated = await db('resource_allocations').where('id', id).first();
    res.json(updated);
  })
);

export default router;
