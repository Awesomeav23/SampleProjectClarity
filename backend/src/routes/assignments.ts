import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../lib/db.js';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validate.js';
import { createAssignmentSchema } from '../schemas/assignmentSchemas.js';
import { services } from '../services/index.js';

const router = Router();
router.use(verifyJWT);

/**
 * POST /api/assignments
 * Create assignment following the ASSIGNMENT_WORKFLOW:
 *   1. Validate capacity
 *   2. Validate bill rate against standard
 *   3. Call JobDiva API
 *   4. Save to DB + audit log
 *   5. Queue notification
 */
router.post(
  '/',
  requirePermission('assignment:create'),
  validateBody(createAssignmentSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const warnings: string[] = [];

    // Verify resource exists
    const resource = await db('resources as r')
      .select('r.*', 'roles.title as role_title')
      .leftJoin('roles', 'r.role_id', 'roles.id')
      .where('r.id', data.resourceId)
      .first();
    if (!resource) throw notFound(`Resource ${data.resourceId} not found`);

    // Verify project exists
    const project = await db('projects as p')
      .select('p.*', 'customers.name as customer_name')
      .join('customers', 'p.customer_id', 'customers.id')
      .where('p.id', data.projectId)
      .first();
    if (!project) throw notFound(`Project ${data.projectId} not found`);

    // ── Step 1: Validate capacity ──────────────────────────────────────────
    const overlapping = await db('resource_allocations')
      .where('resource_id', data.resourceId)
      .andWhere('start_date', '<=', data.endDate)
      .andWhere('end_date', '>=', data.startDate);

    const currentTotal = overlapping.reduce((sum: number, a: any) => sum + a.allocation_percent, 0);
    const newTotal = currentTotal + data.allocationPercent;

    if (newTotal > 100) {
      warnings.push(
        `Capacity warning: ${resource.name} will be at ${newTotal}% allocation (currently ${currentTotal}% across ${overlapping.length} project(s))`
      );
    }

    // ── Step 2: Validate bill rate ─────────────────────────────────────────
    const standardRate = await db('role_rates')
      .where('role_id', resource.role_id)
      .andWhere('location_id', resource.location_id)
      .orderBy('effective_date', 'desc')
      .first();

    if (standardRate) {
      const standard = parseFloat(standardRate.bill_rate);
      const deviation = ((data.billRate - standard) / standard) * 100;
      if (deviation < -10) {
        warnings.push(
          `Rate warning: Bill rate $${data.billRate}/hr is ${Math.abs(Math.round(deviation))}% below standard rate $${standard}/hr for ${resource.role_title}`
        );
      }
    }

    // ── Step 3: Call JobDiva API ───────────────────────────────────────────
    const jdResponse = await services.jobdiva.createJobDivaAssignment({
      resourceId: data.resourceId,
      projectId: data.projectId,
      customerId: project.customer_id,
      startDate: data.startDate,
      endDate: data.endDate,
      allocationPercent: data.allocationPercent,
      billRate: data.billRate,
      approverEmail: data.approverEmail,
    });

    // ── Step 4: Save to DB ────────────────────────────────────────────────
    const assignmentId = `ASGN-${nanoid(6).toUpperCase()}`;
    const status = jdResponse.success ? 'submitted' : 'failed';

    await db('assignments').insert({
      id: assignmentId,
      resource_id: data.resourceId,
      project_id: data.projectId,
      customer_id: project.customer_id,
      start_date: data.startDate,
      end_date: data.endDate,
      allocation_percent: data.allocationPercent,
      bill_rate: data.billRate,
      approver_email: data.approverEmail,
      submitted_by: req.user!.email,
      status,
      jobdiva_assignment_id: jdResponse.assignmentId ?? null,
      capacity_warning: warnings.length > 0 ? warnings.join(' | ') : null,
      notes: data.notes ?? null,
    });

    // Audit log
    await db('audit_log').insert({
      entity_type: 'assignment',
      entity_id: assignmentId,
      action: 'create',
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      changes: JSON.stringify({
        resourceId: data.resourceId,
        resourceName: resource.name,
        projectId: data.projectId,
        projectName: project.name,
        allocationPercent: data.allocationPercent,
        billRate: data.billRate,
        jobdivaId: jdResponse.assignmentId,
        status,
      }),
    });

    // ── Step 5: Queue notification ────────────────────────────────────────
    // In a real system this sends emails. For now, log to console.
    console.log(
      `[NOTIFY] Assignment ${assignmentId}: ${resource.name} → ${project.name} (${data.allocationPercent}%) | Recipients: ash, ankit, hr, naveen, pm, bu-lead, pmo, sales-cs`
    );

    const assignment = await db('assignments').where('id', assignmentId).first();

    res.status(status === 'submitted' ? 201 : 502).json({
      ...assignment,
      resourceName: resource.name,
      projectName: project.name,
      customerName: project.customer_name,
      warnings,
    });
  })
);

/**
 * GET /api/assignments
 * List assignments. Filters: ?projectId, ?resourceId, ?status
 */
router.get(
  '/',
  requirePermission('assignment:read'),
  asyncHandler(async (req, res) => {
    let query = db('assignments as a')
      .select(
        'a.*',
        'resources.name as resource_name',
        'projects.name as project_name',
        'customers.name as customer_name'
      )
      .join('resources', 'a.resource_id', 'resources.id')
      .join('projects', 'a.project_id', 'projects.id')
      .join('customers', 'a.customer_id', 'customers.id')
      .orderBy('a.created_at', 'desc');

    if (req.query.projectId) query = query.where('a.project_id', req.query.projectId as string);
    if (req.query.resourceId) query = query.where('a.resource_id', req.query.resourceId as string);
    if (req.query.status) query = query.where('a.status', req.query.status as string);

    const assignments = await query;
    res.json(assignments);
  })
);

export default router;
