/**
 * Capacity Engine
 *
 * Calculates resource utilization across projects on a weekly basis.
 * Provides three views: resource, project, practice.
 * Generates alerts for over-allocation (>100%) and underutilization (<60%).
 */

import { db } from '../lib/db.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type UtilizationStatus = 'red' | 'yellow' | 'green' | 'gray';

export interface ResourceCapacity {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  locationName: string;
  buPractice: string;
  totalAllocationPercent: number;
  utilizationPercent: number;
  status: UtilizationStatus;
  allocations: {
    projectId: string;
    projectName: string;
    allocationPercent: number;
    hours: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface ProjectCapacity {
  projectId: string;
  projectName: string;
  customerName: string;
  resourceCount: number;
  totalAllocationPercent: number;
  startDate: string;
  endDate: string;
  status: string;
  resources: {
    resourceId: string;
    resourceName: string;
    roleTitle: string;
    allocationPercent: number;
  }[];
}

export interface PracticeCapacity {
  practice: string;
  headcount: number;
  avgUtilization: number;
  overAllocated: number;
  underUtilized: number;
  onBench: number;
}

export interface CapacityAlert {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  utilizationPercent: number;
  type: 'over_allocated' | 'under_utilized' | 'bench';
  projects: { projectId: string; projectName: string; allocationPercent: number }[];
}

// ─── Utilization Calculation ───────────────────────────────────────────────────

function getStatus(percent: number): UtilizationStatus {
  if (percent > 100) return 'red';
  if (percent >= 80) return 'yellow';
  if (percent > 0) return 'green';
  return 'gray';
}

// ─── Resource View ─────────────────────────────────────────────────────────────

export async function getResourceCapacities(
  weekStart: string,
  filters?: { locationId?: string; buPractice?: string }
): Promise<ResourceCapacity[]> {
  // Get all active resources
  let resourceQuery = db('resources as r')
    .select('r.id', 'r.name', 'r.bu_practice', 'roles.title as role_title', 'locations.name as location_name')
    .leftJoin('roles', 'r.role_id', 'roles.id')
    .leftJoin('locations', 'r.location_id', 'locations.id')
    .where('r.status', '!=', 'exiting')
    .orderBy('r.name');

  if (filters?.locationId) resourceQuery = resourceQuery.where('r.location_id', filters.locationId);
  if (filters?.buPractice) resourceQuery = resourceQuery.where('r.bu_practice', filters.buPractice);

  const resources = await resourceQuery;

  // Get all allocations that overlap the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const allocations = await db('resource_allocations as ra')
    .select('ra.*', 'projects.name as project_name')
    .join('projects', 'ra.project_id', 'projects.id')
    .where('ra.start_date', '<=', weekEndStr)
    .andWhere('ra.end_date', '>=', weekStart);

  // Build capacity per resource
  return resources.map((r: any) => {
    const resourceAllocs = allocations
      .filter((a: any) => a.resource_id === r.id)
      .map((a: any) => ({
        projectId: a.project_id,
        projectName: a.project_name,
        allocationPercent: a.allocation_percent,
        hours: Math.round(40 * (a.allocation_percent / 100) * 10) / 10,
        startDate: a.start_date,
        endDate: a.end_date,
      }));

    const totalAlloc = resourceAllocs.reduce((sum: number, a: any) => sum + a.allocationPercent, 0);

    return {
      resourceId: r.id,
      resourceName: r.name,
      roleTitle: r.role_title ?? 'Unknown',
      locationName: r.location_name ?? 'Unknown',
      buPractice: r.bu_practice ?? 'Unknown',
      totalAllocationPercent: totalAlloc,
      utilizationPercent: totalAlloc,
      status: getStatus(totalAlloc),
      allocations: resourceAllocs,
    };
  });
}

// ─── Project View ──────────────────────────────────────────────────────────────

export async function getProjectCapacities(weekStart: string): Promise<ProjectCapacity[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const projects = await db('projects as p')
    .select('p.*', 'customers.name as customer_name')
    .join('customers', 'p.customer_id', 'customers.id')
    .where('p.status', 'active')
    .orderBy('p.name');

  const allocations = await db('resource_allocations as ra')
    .select('ra.*', 'resources.name as resource_name', 'roles.title as role_title')
    .join('resources', 'ra.resource_id', 'resources.id')
    .leftJoin('roles', 'ra.role_id', 'roles.id')
    .where('ra.start_date', '<=', weekEndStr)
    .andWhere('ra.end_date', '>=', weekStart);

  return projects.map((p: any) => {
    const projectAllocs = allocations.filter((a: any) => a.project_id === p.id);
    const totalAlloc = projectAllocs.reduce((sum: number, a: any) => sum + a.allocation_percent, 0);

    return {
      projectId: p.id,
      projectName: p.name,
      customerName: p.customer_name,
      resourceCount: projectAllocs.length,
      totalAllocationPercent: totalAlloc,
      startDate: p.start_date,
      endDate: p.end_date,
      status: p.status,
      resources: projectAllocs.map((a: any) => ({
        resourceId: a.resource_id,
        resourceName: a.resource_name,
        roleTitle: a.role_title ?? 'Unknown',
        allocationPercent: a.allocation_percent,
      })),
    };
  });
}

// ─── Practice View ─────────────────────────────────────────────────────────────

export async function getPracticeCapacities(weekStart: string): Promise<PracticeCapacity[]> {
  const resourceCapacities = await getResourceCapacities(weekStart);

  const practiceMap = new Map<string, ResourceCapacity[]>();
  for (const rc of resourceCapacities) {
    const existing = practiceMap.get(rc.buPractice) ?? [];
    existing.push(rc);
    practiceMap.set(rc.buPractice, existing);
  }

  return Array.from(practiceMap.entries()).map(([practice, resources]) => {
    const avgUtil = resources.length > 0
      ? Math.round(resources.reduce((sum, r) => sum + r.utilizationPercent, 0) / resources.length * 10) / 10
      : 0;

    return {
      practice,
      headcount: resources.length,
      avgUtilization: avgUtil,
      overAllocated: resources.filter((r) => r.utilizationPercent > 100).length,
      underUtilized: resources.filter((r) => r.utilizationPercent > 0 && r.utilizationPercent < 60).length,
      onBench: resources.filter((r) => r.utilizationPercent === 0).length,
    };
  }).sort((a, b) => a.practice.localeCompare(b.practice));
}

// ─── Alerts ────────────────────────────────────────────────────────────────────

export async function getCapacityAlerts(weekStart: string): Promise<{
  overAllocated: CapacityAlert[];
  underUtilized: CapacityAlert[];
}> {
  const resourceCapacities = await getResourceCapacities(weekStart);

  const overAllocated = resourceCapacities
    .filter((r) => r.utilizationPercent > 100)
    .map((r) => ({
      resourceId: r.resourceId,
      resourceName: r.resourceName,
      roleTitle: r.roleTitle,
      utilizationPercent: r.utilizationPercent,
      type: 'over_allocated' as const,
      projects: r.allocations.map((a) => ({
        projectId: a.projectId,
        projectName: a.projectName,
        allocationPercent: a.allocationPercent,
      })),
    }));

  const underUtilized = resourceCapacities
    .filter((r) => r.utilizationPercent === 0 || (r.utilizationPercent > 0 && r.utilizationPercent < 60))
    .map((r) => ({
      resourceId: r.resourceId,
      resourceName: r.resourceName,
      roleTitle: r.roleTitle,
      utilizationPercent: r.utilizationPercent,
      type: (r.utilizationPercent === 0 ? 'bench' : 'under_utilized') as 'bench' | 'under_utilized',
      projects: r.allocations.map((a) => ({
        projectId: a.projectId,
        projectName: a.projectName,
        allocationPercent: a.allocationPercent,
      })),
    }));

  return { overAllocated, underUtilized };
}
