/**
 * Burnt Report Service (DB-backed)
 *
 * Reads from PostgreSQL instead of mock arrays.
 * Uses the same variance logic as burntReport.ts but queries real tables.
 */

import { db } from '../lib/db.js';
import { MARGIN_FORMULAS } from './financeRules.js';

export type VarianceStatus = 'green' | 'yellow' | 'red';

const THRESHOLDS = { green: 5, yellow: 10 };

function getVarianceStatus(variancePercent: number): VarianceStatus {
  const abs = Math.abs(variancePercent);
  if (abs < THRESHOLDS.green) return 'green';
  if (abs < THRESHOLDS.yellow) return 'yellow';
  return 'red';
}

function worstStatus(...statuses: VarianceStatus[]): VarianceStatus {
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('yellow')) return 'yellow';
  return 'green';
}

export interface BurntReportResult {
  reportId: string;
  projectId: string;
  projectName: string;
  sowId: string | null;
  customerId: string;
  customerName: string;
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  baseline: {
    totalPlannedHours: number;
    totalPlannedCost: number;
    totalPlannedRevenue: number;
    plannedMarginPercent: number;
    resources: any[];
  };
  actuals: {
    totalActualHours: number;
    totalActualCost: number;
    totalActualRevenue: number;
    actualMarginPercent: number;
    resources: any[];
    lastTimesheetSync: string;
  };
  variance: {
    hoursVariance: number;
    hoursVariancePercent: number;
    costVariance: number;
    costVariancePercent: number;
    revenueVariance: number;
    revenueVariancePercent: number;
    marginVariance: number;
    hoursStatus: VarianceStatus;
    costStatus: VarianceStatus;
    marginStatus: VarianceStatus;
  };
  resourceDetails: any[];
  overallStatus: VarianceStatus;
}

export async function generateBurntReport(
  projectId: string,
  periodStart: string,
  periodEnd: string,
  canReadFlc: boolean
): Promise<BurntReportResult | null> {
  // Get project
  const project = await db('projects as p')
    .select('p.*', 'customers.name as customer_name')
    .join('customers', 'p.customer_id', 'customers.id')
    .where('p.id', projectId)
    .first();
  if (!project) return null;

  // Get allocations for this project
  const allocations = await db('resource_allocations as ra')
    .select('ra.*', 'resources.name as resource_name', 'resources.flc_per_hour', 'roles.title as role_title')
    .join('resources', 'ra.resource_id', 'resources.id')
    .leftJoin('roles', 'ra.role_id', 'roles.id')
    .where('ra.project_id', projectId);

  // Get timesheets for this project in period
  const timesheets = await db('timesheets')
    .where('project_id', projectId)
    .andWhere('week_start_date', '>=', periodStart)
    .andWhere('week_start_date', '<=', periodEnd);

  // ── Baseline ────────────────────────────────────────────────────────────
  const weeksInPeriod = Math.max(1, Math.round(
    (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ));

  const baselineResources = allocations.map((alloc: any) => {
    const plannedHoursPerWeek = 40 * (alloc.allocation_percent / 100);
    const plannedHours = Math.round(plannedHoursPerWeek * weeksInPeriod);
    const flcRate = parseFloat(alloc.flc_per_hour);
    const billRate = parseFloat(alloc.bill_rate);

    return {
      resourceId: alloc.resource_id,
      resourceName: alloc.resource_name,
      roleTitle: alloc.role_title ?? 'Unknown',
      plannedHours,
      billRate,
      flcRate,
      plannedRevenue: Math.round(plannedHours * billRate),
      plannedCost: Math.round(plannedHours * flcRate),
      allocationPercent: alloc.allocation_percent,
    };
  });

  const totalPlannedHours = baselineResources.reduce((s: number, r: any) => s + r.plannedHours, 0);
  const totalPlannedRevenue = baselineResources.reduce((s: number, r: any) => s + r.plannedRevenue, 0);
  const totalPlannedCost = baselineResources.reduce((s: number, r: any) => s + r.plannedCost, 0);
  const plannedMarginPercent = totalPlannedRevenue > 0
    ? Math.round(((totalPlannedRevenue - totalPlannedCost) / totalPlannedRevenue) * 1000) / 10
    : 0;

  // ── Actuals ─────────────────────────────────────────────────────────────
  const actualsByResource = new Map<string, number>();
  for (const ts of timesheets) {
    const current = actualsByResource.get(ts.resource_id) ?? 0;
    actualsByResource.set(ts.resource_id, current + parseFloat(ts.total_hours));
  }

  const actualsResources = allocations.map((alloc: any) => {
    const actualHours = actualsByResource.get(alloc.resource_id) ?? 0;
    const billRate = parseFloat(alloc.bill_rate);
    const flcRate = parseFloat(alloc.flc_per_hour);

    return {
      resourceId: alloc.resource_id,
      resourceName: alloc.resource_name,
      roleTitle: alloc.role_title ?? 'Unknown',
      actualHours,
      billRate,
      flcRate,
      actualRevenue: Math.round(actualHours * billRate),
      actualCost: Math.round(actualHours * flcRate),
    };
  });

  const totalActualHours = actualsResources.reduce((s: number, r: any) => s + r.actualHours, 0);
  const totalActualRevenue = actualsResources.reduce((s: number, r: any) => s + r.actualRevenue, 0);
  const totalActualCost = actualsResources.reduce((s: number, r: any) => s + r.actualCost, 0);
  const actualMarginPercent = totalActualRevenue > 0
    ? Math.round(((totalActualRevenue - totalActualCost) / totalActualRevenue) * 1000) / 10
    : 0;

  // ── Variance ────────────────────────────────────────────────────────────
  const hoursVariance = totalActualHours - totalPlannedHours;
  const hoursVariancePercent = totalPlannedHours > 0 ? Math.round((hoursVariance / totalPlannedHours) * 1000) / 10 : 0;
  const costVariance = totalActualCost - totalPlannedCost;
  const costVariancePercent = totalPlannedCost > 0 ? Math.round((costVariance / totalPlannedCost) * 1000) / 10 : 0;
  const revenueVariance = totalActualRevenue - totalPlannedRevenue;
  const revenueVariancePercent = totalPlannedRevenue > 0 ? Math.round((revenueVariance / totalPlannedRevenue) * 1000) / 10 : 0;
  const marginVariance = Math.round((actualMarginPercent - plannedMarginPercent) * 10) / 10;

  const hoursStatus = getVarianceStatus(hoursVariancePercent);
  const costStatus = getVarianceStatus(costVariancePercent);
  const marginStatus = getVarianceStatus(marginVariance);

  // ── Per-Resource Detail ─────────────────────────────────────────────────
  const resourceDetails = baselineResources.map((br: any) => {
    const ar = actualsResources.find((a: any) => a.resourceId === br.resourceId);
    const actualHours = ar?.actualHours ?? 0;
    const actualCost = ar?.actualCost ?? 0;
    const actualRevenue = ar?.actualRevenue ?? 0;
    const hrsVar = actualHours - br.plannedHours;
    const hrsVarPct = br.plannedHours > 0 ? Math.round((hrsVar / br.plannedHours) * 1000) / 10 : 0;

    const detail: any = {
      resourceId: br.resourceId,
      resourceName: br.resourceName,
      roleTitle: br.roleTitle,
      plannedHours: br.plannedHours,
      actualHours,
      hoursVariance: Math.round(hrsVar),
      hoursVariancePercent: hrsVarPct,
      plannedRevenue: br.plannedRevenue,
      actualRevenue,
      revenueVariance: Math.round(actualRevenue - br.plannedRevenue),
      status: getVarianceStatus(hrsVarPct),
    };

    // Only include cost data if user has FLC access
    if (canReadFlc) {
      detail.plannedCost = br.plannedCost;
      detail.actualCost = actualCost;
      detail.costVariance = Math.round(actualCost - br.plannedCost);
    }

    return detail;
  });

  // Build result — strip cost data if no FLC access
  const result: BurntReportResult = {
    reportId: `BR-${projectId}-${periodEnd}`,
    projectId,
    projectName: project.name,
    sowId: project.sow_id,
    customerId: project.customer_id,
    customerName: project.customer_name,
    reportDate: new Date().toISOString(),
    periodStart,
    periodEnd,
    baseline: {
      totalPlannedHours,
      totalPlannedCost: canReadFlc ? totalPlannedCost : 0,
      totalPlannedRevenue,
      plannedMarginPercent,
      resources: canReadFlc ? baselineResources : baselineResources.map(({ flcRate, plannedCost, ...rest }: any) => rest),
    },
    actuals: {
      totalActualHours,
      totalActualCost: canReadFlc ? totalActualCost : 0,
      totalActualRevenue,
      actualMarginPercent,
      resources: canReadFlc ? actualsResources : actualsResources.map(({ flcRate, actualCost, ...rest }: any) => rest),
      lastTimesheetSync: new Date().toISOString(),
    },
    variance: {
      hoursVariance: Math.round(hoursVariance),
      hoursVariancePercent,
      costVariance: canReadFlc ? Math.round(costVariance) : 0,
      costVariancePercent: canReadFlc ? costVariancePercent : 0,
      revenueVariance: Math.round(revenueVariance),
      revenueVariancePercent,
      marginVariance,
      hoursStatus,
      costStatus,
      marginStatus,
    },
    resourceDetails,
    overallStatus: worstStatus(hoursStatus, costStatus, marginStatus),
  };

  return result;
}

export async function generateAllBurntReports(
  periodStart: string,
  periodEnd: string,
  canReadFlc: boolean
): Promise<BurntReportResult[]> {
  const activeProjects = await db('projects')
    .where('status', 'active')
    .whereNotNull('sow_id');

  const reports: BurntReportResult[] = [];
  for (const p of activeProjects) {
    const report = await generateBurntReport(p.id, periodStart, periodEnd, canReadFlc);
    if (report) reports.push(report);
  }
  return reports;
}
