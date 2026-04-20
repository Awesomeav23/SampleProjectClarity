/**
 * Finance Rules & Margin Formulas
 *
 * Stakeholder-approved financial calculations and thresholds.
 * Sign-off: Madhup & Aishwarya (Finance/Operations)
 *
 * These are the authoritative formulas used across:
 *   - SOW creation (margin calculation)
 *   - Burnt reports (variance tracking)
 *   - Change orders (financial impact)
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FinanceSignOff {
  approvedBy: string[];
  approvedDate: string;
  version: number;
  status: 'approved' | 'pending_review';
  notes: string;
}

export interface MarginThreshold {
  minMarginPercent: number;
  maxMarginPercent: number | null;
  approvalLevel: string;
  approvers: string[];
  description: string;
}

export interface BurntReportConfig {
  varianceThresholds: {
    green: number;   // % variance — healthy
    yellow: number;  // % variance — warning
    // > yellow = red (critical)
  };
  refreshFrequency: string;
  dataSource: string;
  baselineLockTrigger: string;
  signOff: FinanceSignOff;
}

// ─── Margin Calculation Formulas (Approved) ────────────────────────────────────

export const MARGIN_FORMULAS = {
  signOff: {
    approvedBy: ['madhup@dynpro.com', 'aishwarya@dynpro.com'],
    approvedDate: '2026-04-10',
    version: 1,
    status: 'approved' as const,
    notes: 'Confirmed formulas match current Excel-based calculations. FLC visibility restricted — sales team must not see FLC values.',
  },

  /**
   * Operating Margin for a single resource line
   * Revenue = Hours x Bill Rate
   * Cost = Hours x FLC
   * Margin = ((Revenue - Cost) / Revenue) x 100
   */
  resourceLineMargin(hours: number, billRate: number, flcRate: number) {
    const revenue = hours * billRate;
    const cost = hours * flcRate;
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  },

  /**
   * SOW-level operating margin (aggregate across all resource lines)
   */
  sowMargin(
    lines: { hours: number; billRate: number; flcRate: number }[]
  ): { totalRevenue: number; totalCost: number; marginPercent: number } {
    const totalRevenue = lines.reduce((sum, l) => sum + l.hours * l.billRate, 0);
    const totalCost = lines.reduce((sum, l) => sum + l.hours * l.flcRate, 0);
    const marginPercent = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      marginPercent: Math.round(marginPercent * 10) / 10,
    };
  },

  /**
   * Margin erosion after FLC increase (e.g., mid-project appraisal)
   * Example from business case: FLC $68 → $75, bill rate $130 unchanged
   *   Before: margin = ($130 - $68) / $130 = 47.7%
   *   After:  margin = ($130 - $75) / $130 = 42.3%
   *   Erosion: -5.4 percentage points
   */
  marginErosion(
    billRate: number,
    originalFlc: number,
    newFlc: number
  ): { originalMargin: number; newMargin: number; erosion: number } {
    const originalMargin = ((billRate - originalFlc) / billRate) * 100;
    const newMargin = ((billRate - newFlc) / billRate) * 100;
    return {
      originalMargin: Math.round(originalMargin * 10) / 10,
      newMargin: Math.round(newMargin * 10) / 10,
      erosion: Math.round((newMargin - originalMargin) * 10) / 10,
    };
  },

  /**
   * Change order financial impact
   * Net Impact = Additions - Credits
   * Updated SOW Value = Original SOW Value + Net Impact
   */
  changeOrderImpact(
    additions: { hours: number; billRate: number }[],
    credits: { hours: number; billRate: number }[]
  ): { additionsTotal: number; creditsTotal: number; netImpact: number } {
    const additionsTotal = additions.reduce((sum, a) => sum + a.hours * a.billRate, 0);
    const creditsTotal = credits.reduce((sum, c) => sum + c.hours * c.billRate, 0);
    return {
      additionsTotal: Math.round(additionsTotal * 100) / 100,
      creditsTotal: Math.round(creditsTotal * 100) / 100,
      netImpact: Math.round((additionsTotal - creditsTotal) * 100) / 100,
    };
  },

  /**
   * Capacity utilization
   * Total Capacity = 40 hrs/week (adjustable per resource)
   * Booked = SUM(allocations across all projects)
   * Available = Total - Booked
   * Utilization % = (Booked / Total) x 100
   */
  utilization(
    totalCapacityHours: number,
    bookedHours: number
  ): { available: number; utilizationPercent: number } {
    const available = totalCapacityHours - bookedHours;
    const utilizationPercent = totalCapacityHours > 0 ? (bookedHours / totalCapacityHours) * 100 : 0;
    return {
      available: Math.round(available * 10) / 10,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    };
  },
};

// ─── Margin Approval Thresholds (Approved) ─────────────────────────────────────

export const MARGIN_THRESHOLDS: MarginThreshold[] = [
  {
    minMarginPercent: 40, maxMarginPercent: null,
    approvalLevel: 'Standard',
    approvers: ['madhup@dynpro.com'],
    description: 'Standard approval — Finance Ops only',
  },
  {
    minMarginPercent: 35, maxMarginPercent: 40,
    approvalLevel: 'Escalated',
    approvers: ['bu-head@dynpro.com', 'cro@dynpro.com'],
    description: 'Escalated — BU Head and CRO approval required',
  },
  {
    minMarginPercent: 0, maxMarginPercent: 35,
    approvalLevel: 'SLT',
    approvers: ['bu-head@dynpro.com', 'cro@dynpro.com', 'shiv@dynpro.com'],
    description: 'SLT approval — full leadership chain required',
  },
];

export function getApprovalLevel(marginPercent: number): MarginThreshold {
  return MARGIN_THRESHOLDS.find(
    (t) => marginPercent >= t.minMarginPercent && (t.maxMarginPercent === null || marginPercent < t.maxMarginPercent)
  ) ?? MARGIN_THRESHOLDS[MARGIN_THRESHOLDS.length - 1];
}

// ─── Burnt Report Configuration (Approved) ─────────────────────────────────────

export const BURNT_REPORT_CONFIG: BurntReportConfig = {
  varianceThresholds: {
    green: 5,    // < 5% variance = healthy
    yellow: 10,  // 5-10% = warning, > 10% = red/critical
  },
  refreshFrequency: 'Hourly sync from JobDiva timesheets',
  dataSource: 'JobDiva Timesheet API',
  baselineLockTrigger: 'SOW signed in DocuSign (envelope completed event)',
  signOff: {
    approvedBy: ['madhup@dynpro.com', 'aishwarya@dynpro.com'],
    approvedDate: '2026-04-10',
    version: 1,
    status: 'approved',
    notes: 'Format matches current Excel burnt report layout. Top = baseline (locked), Bottom = actuals (live). Variance calculated for hours, cost, and margin. Color coding: Green/Yellow/Red per thresholds.',
  },
};

// ─── FLC Visibility Rules ──────────────────────────────────────────────────────

export const FLC_VISIBILITY = {
  signOff: {
    approvedBy: ['madhup@dynpro.com'],
    approvedDate: '2026-04-10',
    version: 1,
    status: 'approved' as const,
    notes: 'FLC data is RESTRICTED. Sales team must not see FLC values — only bill rates and margin %. This prevents cost-focused negotiation that erodes margins.',
  },
  rules: [
    { role: 'Finance Head', canViewFLC: true, canViewMargin: true },
    { role: 'Finance/Operations', canViewFLC: true, canViewMargin: true },
    { role: 'Executive Leadership', canViewFLC: true, canViewMargin: true },
    { role: 'Project Manager', canViewFLC: false, canViewMargin: true },
    { role: 'BU Head', canViewFLC: true, canViewMargin: true },
    { role: 'Sales', canViewFLC: false, canViewMargin: false },
    { role: 'Back Office', canViewFLC: false, canViewMargin: false },
    { role: 'Employee', canViewFLC: false, canViewMargin: false },
  ],
};
