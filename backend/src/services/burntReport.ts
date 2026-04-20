/**
 * Burnt Report Format & Mock Data
 *
 * The burnt report is DynPro's core project financial tracking tool.
 * Structure (from the business case):
 *   - Top section: Baseline plan (immutable after SOW signing)
 *   - Bottom section: Actuals (from JobDiva timesheet data)
 *   - Variance: Planned vs. Actual for hours, cost, and margin
 *
 * Color-coded status:
 *   - Green: variance within threshold (< 5%)
 *   - Yellow: variance approaching threshold (5-10%)
 *   - Red: variance exceeding threshold (> 10%)
 */

import {
  RESOURCES,
  PROJECTS,
  SOWS,
  RESOURCE_ALLOCATIONS,
  TIMESHEET_ENTRIES,
  ROLES,
  type Resource as MockResource,
} from './mockData.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type VarianceStatus = 'green' | 'yellow' | 'red';

export interface BurntReport {
  reportId: string;
  projectId: string;
  projectName: string;
  sowId: string;
  customerId: string;
  customerName: string;
  reportDate: string;          // when the report was generated
  periodStart: string;         // reporting period start
  periodEnd: string;           // reporting period end
  baseline: BaselinePlan;
  actuals: ActualsPlan;
  variance: VarianceSummary;
  resourceDetails: ResourceBurntDetail[];
  overallStatus: VarianceStatus;
}

export interface BaselinePlan {
  totalPlannedHours: number;
  totalPlannedCost: number;     // hours x FLC
  totalPlannedRevenue: number;  // hours x bill rate
  plannedMarginPercent: number; // ((revenue - cost) / revenue) x 100
  resources: BaselineResourceEntry[];
}

export interface BaselineResourceEntry {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  location: string;
  plannedHours: number;
  billRate: number;
  flcRate: number;
  plannedRevenue: number;  // hours x bill rate
  plannedCost: number;     // hours x FLC
  allocationPercent: number;
}

export interface ActualsPlan {
  totalActualHours: number;
  totalActualCost: number;
  totalActualRevenue: number;
  actualMarginPercent: number;
  resources: ActualsResourceEntry[];
  lastTimesheetSync: string;   // when timesheet data was last pulled
}

export interface ActualsResourceEntry {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  actualHours: number;
  billRate: number;
  flcRate: number;
  actualRevenue: number;
  actualCost: number;
}

export interface VarianceSummary {
  hoursVariance: number;        // actual - planned (negative = under, positive = over)
  hoursVariancePercent: number;
  costVariance: number;
  costVariancePercent: number;
  revenueVariance: number;
  revenueVariancePercent: number;
  marginVariance: number;       // actual margin % - planned margin %
  hoursStatus: VarianceStatus;
  costStatus: VarianceStatus;
  marginStatus: VarianceStatus;
}

export interface ResourceBurntDetail {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  plannedHours: number;
  actualHours: number;
  hoursVariance: number;
  hoursVariancePercent: number;
  plannedCost: number;
  actualCost: number;
  costVariance: number;
  plannedRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  status: VarianceStatus;
}

// ─── Variance Threshold Configuration ──────────────────────────────────────────

const THRESHOLDS = {
  green: 5,   // < 5% variance
  yellow: 10, // 5-10% variance
  // > 10% = red
};

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

// ─── Report Generation ─────────────────────────────────────────────────────────

export function generateBurntReport(
  projectId: string,
  periodStart: string,
  periodEnd: string
): BurntReport | null {
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;

  const sow = SOWS.find((s) => s.projectId === projectId);
  if (!sow) return null;

  const allocations = RESOURCE_ALLOCATIONS.filter((a) => a.projectId === projectId);

  // ── Build Baseline ──────────────────────────────────────────────────────
  const baselineResources: BaselineResourceEntry[] = allocations.map((alloc) => {
    const resource = RESOURCES.find((r) => r.id === alloc.resourceId)!;
    const role = ROLES.find((rl) => rl.id === alloc.roleId);
    const weeksInPeriod = getWeeksBetween(periodStart, periodEnd);
    const plannedHoursPerWeek = 40 * (alloc.allocationPercent / 100);
    const plannedHours = plannedHoursPerWeek * weeksInPeriod;

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      roleTitle: role?.title ?? 'Unknown',
      location: resource.locationId,
      plannedHours: Math.round(plannedHours),
      billRate: alloc.billRate,
      flcRate: resource.flcPerHour,
      plannedRevenue: Math.round(plannedHours * alloc.billRate),
      plannedCost: Math.round(plannedHours * resource.flcPerHour),
      allocationPercent: alloc.allocationPercent,
    };
  });

  const totalPlannedHours = baselineResources.reduce((sum, r) => sum + r.plannedHours, 0);
  const totalPlannedRevenue = baselineResources.reduce((sum, r) => sum + r.plannedRevenue, 0);
  const totalPlannedCost = baselineResources.reduce((sum, r) => sum + r.plannedCost, 0);
  const plannedMarginPercent = totalPlannedRevenue > 0
    ? ((totalPlannedRevenue - totalPlannedCost) / totalPlannedRevenue) * 100
    : 0;

  const baseline: BaselinePlan = {
    totalPlannedHours,
    totalPlannedCost,
    totalPlannedRevenue,
    plannedMarginPercent: Math.round(plannedMarginPercent * 10) / 10,
    resources: baselineResources,
  };

  // ── Build Actuals ───────────────────────────────────────────────────────
  const timesheets = TIMESHEET_ENTRIES.filter(
    (ts) => ts.projectId === projectId && ts.weekStartDate >= periodStart && ts.weekStartDate <= periodEnd
  );

  const actualsByResource = new Map<string, number>();
  for (const ts of timesheets) {
    const current = actualsByResource.get(ts.resourceId) ?? 0;
    actualsByResource.set(ts.resourceId, current + ts.totalHours);
  }

  const actualsResources: ActualsResourceEntry[] = allocations.map((alloc) => {
    const resource = RESOURCES.find((r) => r.id === alloc.resourceId)!;
    const role = ROLES.find((rl) => rl.id === alloc.roleId);
    const actualHours = actualsByResource.get(resource.id) ?? 0;

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      roleTitle: role?.title ?? 'Unknown',
      actualHours,
      billRate: alloc.billRate,
      flcRate: resource.flcPerHour,
      actualRevenue: Math.round(actualHours * alloc.billRate),
      actualCost: Math.round(actualHours * resource.flcPerHour),
    };
  });

  const totalActualHours = actualsResources.reduce((sum, r) => sum + r.actualHours, 0);
  const totalActualRevenue = actualsResources.reduce((sum, r) => sum + r.actualRevenue, 0);
  const totalActualCost = actualsResources.reduce((sum, r) => sum + r.actualCost, 0);
  const actualMarginPercent = totalActualRevenue > 0
    ? ((totalActualRevenue - totalActualCost) / totalActualRevenue) * 100
    : 0;

  const actuals: ActualsPlan = {
    totalActualHours,
    totalActualCost,
    totalActualRevenue,
    actualMarginPercent: Math.round(actualMarginPercent * 10) / 10,
    resources: actualsResources,
    lastTimesheetSync: new Date().toISOString(),
  };

  // ── Calculate Variance ──────────────────────────────────────────────────
  const hoursVariance = totalActualHours - totalPlannedHours;
  const hoursVariancePercent = totalPlannedHours > 0 ? (hoursVariance / totalPlannedHours) * 100 : 0;
  const costVariance = totalActualCost - totalPlannedCost;
  const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;
  const revenueVariance = totalActualRevenue - totalPlannedRevenue;
  const revenueVariancePercent = totalPlannedRevenue > 0 ? (revenueVariance / totalPlannedRevenue) * 100 : 0;
  const marginVariance = actuals.actualMarginPercent - baseline.plannedMarginPercent;

  const hoursStatus = getVarianceStatus(hoursVariancePercent);
  const costStatus = getVarianceStatus(costVariancePercent);
  const marginStatus = getVarianceStatus(marginVariance);

  const variance: VarianceSummary = {
    hoursVariance: Math.round(hoursVariance),
    hoursVariancePercent: Math.round(hoursVariancePercent * 10) / 10,
    costVariance: Math.round(costVariance),
    costVariancePercent: Math.round(costVariancePercent * 10) / 10,
    revenueVariance: Math.round(revenueVariance),
    revenueVariancePercent: Math.round(revenueVariancePercent * 10) / 10,
    marginVariance: Math.round(marginVariance * 10) / 10,
    hoursStatus,
    costStatus,
    marginStatus,
  };

  // ── Per-Resource Detail ─────────────────────────────────────────────────
  const resourceDetails: ResourceBurntDetail[] = baselineResources.map((br) => {
    const ar = actualsResources.find((a) => a.resourceId === br.resourceId);
    const actualHours = ar?.actualHours ?? 0;
    const actualCost = ar?.actualCost ?? 0;
    const actualRevenue = ar?.actualRevenue ?? 0;
    const hrsVar = actualHours - br.plannedHours;
    const hrsVarPct = br.plannedHours > 0 ? (hrsVar / br.plannedHours) * 100 : 0;

    return {
      resourceId: br.resourceId,
      resourceName: br.resourceName,
      roleTitle: br.roleTitle,
      plannedHours: br.plannedHours,
      actualHours,
      hoursVariance: Math.round(hrsVar),
      hoursVariancePercent: Math.round(hrsVarPct * 10) / 10,
      plannedCost: br.plannedCost,
      actualCost,
      costVariance: Math.round(actualCost - br.plannedCost),
      plannedRevenue: br.plannedRevenue,
      actualRevenue,
      revenueVariance: Math.round(actualRevenue - br.plannedRevenue),
      status: getVarianceStatus(hrsVarPct),
    };
  });

  return {
    reportId: `BR-${projectId}-${periodEnd}`,
    projectId,
    projectName: project.name,
    sowId: sow.id,
    customerId: project.customerId,
    customerName: RESOURCES.length > 0 ? sow.title.split(' ')[0] : 'Unknown',
    reportDate: new Date().toISOString(),
    periodStart,
    periodEnd,
    baseline,
    actuals,
    variance,
    resourceDetails,
    overallStatus: worstStatus(hoursStatus, costStatus, marginStatus),
  };
}

/**
 * Generate burnt reports for all active projects.
 */
export function generateAllBurntReports(periodStart: string, periodEnd: string): BurntReport[] {
  const activeProjects = PROJECTS.filter((p) => p.status === 'active' && p.sowId);
  return activeProjects
    .map((p) => generateBurntReport(p.id, periodStart, periodEnd))
    .filter((r): r is BurntReport => r !== null);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWeeksBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
