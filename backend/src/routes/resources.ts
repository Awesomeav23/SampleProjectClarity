import { Router } from 'express';
import { db } from '../lib/db.js';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(verifyJWT);

/**
 * Strips FLC data from resource objects if user lacks flc:read permission.
 */
function stripFlcIfNeeded(resource: any, canReadFlc: boolean) {
  if (!canReadFlc) {
    const { flc_per_hour, ...rest } = resource;
    return rest;
  }
  return resource;
}

/**
 * GET /api/resources
 * List all resources with role and location resolved.
 * Optional filters: ?status=active, ?locationId=LOC-US, ?roleId=ROLE-002
 */
router.get(
  '/',
  requirePermission('employee:read'),
  asyncHandler(async (req, res) => {
    const canReadFlc = req.user!.permissions.includes('flc:read');

    let query = db('resources as r')
      .select(
        'r.*',
        'roles.title as role_title',
        'roles.practice',
        'roles.level',
        'locations.name as location_name'
      )
      .leftJoin('roles', 'r.role_id', 'roles.id')
      .leftJoin('locations', 'r.location_id', 'locations.id')
      .orderBy('r.name');

    if (req.query.status) query = query.where('r.status', req.query.status as string);
    if (req.query.locationId) query = query.where('r.location_id', req.query.locationId as string);
    if (req.query.roleId) query = query.where('r.role_id', req.query.roleId as string);

    const resources = await query;
    res.json(resources.map((r) => stripFlcIfNeeded(r, canReadFlc)));
  })
);

/**
 * GET /api/resources/:id
 * Single resource with skills, role, and location.
 */
router.get(
  '/:id',
  requirePermission('employee:read'),
  asyncHandler(async (req, res) => {
    const canReadFlc = req.user!.permissions.includes('flc:read');

    const resource = await db('resources as r')
      .select(
        'r.*',
        'roles.title as role_title',
        'roles.practice',
        'roles.level',
        'locations.name as location_name'
      )
      .leftJoin('roles', 'r.role_id', 'roles.id')
      .leftJoin('locations', 'r.location_id', 'locations.id')
      .where('r.id', req.params.id)
      .first();

    if (!resource) throw notFound(`Resource ${req.params.id} not found`);

    const skills = await db('resource_skills')
      .select('skills.id', 'skills.name', 'skills.competency')
      .join('skills', 'resource_skills.skill_id', 'skills.id')
      .where('resource_skills.resource_id', req.params.id);

    res.json({ ...stripFlcIfNeeded(resource, canReadFlc), skills });
  })
);

/**
 * GET /api/resources/:id/capacity?weekStart=2026-04-13&weeks=4
 * Resource utilization for the specified period.
 */
router.get(
  '/:id/capacity',
  requirePermission('capacity:read'),
  asyncHandler(async (req, res) => {
    const resourceId = req.params.id;
    const weekStart = (req.query.weekStart as string) ?? new Date().toISOString().slice(0, 10);
    const weeks = parseInt((req.query.weeks as string) ?? '1', 10);

    const resource = await db('resources').where('id', resourceId).first();
    if (!resource) throw notFound(`Resource ${resourceId} not found`);

    // Get all allocations that overlap the requested period
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + weeks * 7);

    const allocations = await db('resource_allocations as ra')
      .select('ra.*', 'projects.name as project_name')
      .join('projects', 'ra.project_id', 'projects.id')
      .where('ra.resource_id', resourceId)
      .andWhere('ra.start_date', '<=', endDate.toISOString().slice(0, 10))
      .andWhere('ra.end_date', '>=', weekStart);

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocation_percent, 0);
    const totalCapacity = 40; // hours per week
    const bookedHours = totalCapacity * (totalAllocated / 100);
    const available = totalCapacity - bookedHours;
    const utilizationPercent = Math.round((totalAllocated / 100) * 100 * 10) / 10;

    let status: string;
    if (utilizationPercent > 100) status = 'red';
    else if (utilizationPercent >= 80) status = 'yellow';
    else if (utilizationPercent > 0) status = 'green';
    else status = 'gray';

    res.json({
      resourceId,
      resourceName: resource.name,
      weekStart,
      weeks,
      totalCapacity,
      booked: Math.round(bookedHours * 10) / 10,
      available: Math.round(available * 10) / 10,
      utilizationPercent,
      status,
      allocations: allocations.map((a) => ({
        projectId: a.project_id,
        projectName: a.project_name,
        allocationPercent: a.allocation_percent,
        hours: Math.round(totalCapacity * (a.allocation_percent / 100) * 10) / 10,
        startDate: a.start_date,
        endDate: a.end_date,
      })),
    });
  })
);

export default router;
