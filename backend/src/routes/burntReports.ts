import { Router } from 'express';
import ExcelJS from 'exceljs';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateBurntReport, generateAllBurntReports } from '../services/burntReportService.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/burnt-reports
 * List burnt reports for all active projects.
 *   ?periodStart=2026-04-01&periodEnd=2026-04-30
 */
router.get(
  '/',
  requirePermission('burnt_report:read'),
  asyncHandler(async (req, res) => {
    const periodStart = (req.query.periodStart as string) ?? getFirstOfMonth();
    const periodEnd = (req.query.periodEnd as string) ?? getLastOfMonth();
    const canReadFlc = req.user!.permissions.includes('flc:read');

    const reports = await generateAllBurntReports(periodStart, periodEnd, canReadFlc);

    // Return summary view
    res.json(
      reports.map((r) => ({
        reportId: r.reportId,
        projectId: r.projectId,
        projectName: r.projectName,
        customerName: r.customerName,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        plannedHours: r.baseline.totalPlannedHours,
        actualHours: r.actuals.totalActualHours,
        hoursVariancePercent: r.variance.hoursVariancePercent,
        plannedRevenue: r.baseline.totalPlannedRevenue,
        actualRevenue: r.actuals.totalActualRevenue,
        plannedMarginPercent: r.baseline.plannedMarginPercent,
        actualMarginPercent: r.actuals.actualMarginPercent,
        marginVariance: r.variance.marginVariance,
        overallStatus: r.overallStatus,
      }))
    );
  })
);

/**
 * GET /api/burnt-reports/:projectId
 * Full burnt report for a specific project.
 *   ?periodStart=2026-04-01&periodEnd=2026-04-30
 */
router.get(
  '/:projectId',
  requirePermission('burnt_report:read'),
  asyncHandler(async (req, res) => {
    const projectId = req.params.projectId as string;
    const periodStart = (req.query.periodStart as string) ?? getFirstOfMonth();
    const periodEnd = (req.query.periodEnd as string) ?? getLastOfMonth();
    const canReadFlc = req.user!.permissions.includes('flc:read');

    const report = await generateBurntReport(projectId, periodStart, periodEnd, canReadFlc);
    if (!report) throw notFound(`No report data for project ${projectId}`);

    res.json(report);
  })
);

/**
 * GET /api/burnt-reports/:projectId/export
 * Export burnt report as Excel.
 *   ?periodStart=2026-04-01&periodEnd=2026-04-30&format=xlsx
 */
router.get(
  '/:projectId/export',
  requirePermission('burnt_report:export'),
  asyncHandler(async (req, res) => {
    const projectId = req.params.projectId as string;
    const periodStart = (req.query.periodStart as string) ?? getFirstOfMonth();
    const periodEnd = (req.query.periodEnd as string) ?? getLastOfMonth();
    const canReadFlc = req.user!.permissions.includes('flc:read');

    const report = await generateBurntReport(projectId, periodStart, periodEnd, canReadFlc);
    if (!report) throw notFound(`No report data for project ${projectId}`);

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Project Clarity';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Burnt Report');

    // Header
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Burnt Report: ${report.projectName}`;
    titleCell.font = { size: 16, bold: true };

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = `Period: ${periodStart} to ${periodEnd} | Status: ${report.overallStatus.toUpperCase()}`;

    // Summary row
    sheet.addRow([]);
    sheet.addRow(['', 'Planned', 'Actual', 'Variance', 'Var %', 'Status']);
    sheet.addRow(['Hours', report.baseline.totalPlannedHours, report.actuals.totalActualHours, report.variance.hoursVariance, `${report.variance.hoursVariancePercent}%`, report.variance.hoursStatus]);
    sheet.addRow(['Revenue', report.baseline.totalPlannedRevenue, report.actuals.totalActualRevenue, report.variance.revenueVariance, `${report.variance.revenueVariancePercent}%`, '']);
    sheet.addRow(['Margin %', `${report.baseline.plannedMarginPercent}%`, `${report.actuals.actualMarginPercent}%`, `${report.variance.marginVariance}%`, '', report.variance.marginStatus]);

    // Resource detail
    sheet.addRow([]);
    sheet.addRow(['Resource Detail']);

    const detailHeaders = ['Resource', 'Role', 'Planned Hrs', 'Actual Hrs', 'Hrs Variance', 'Hrs Var %', 'Status'];
    sheet.addRow(detailHeaders);

    for (const rd of report.resourceDetails) {
      sheet.addRow([
        rd.resourceName,
        rd.roleTitle,
        rd.plannedHours,
        rd.actualHours,
        rd.hoursVariance,
        `${rd.hoursVariancePercent}%`,
        rd.status,
      ]);
    }

    // Style header row
    sheet.getRow(4).font = { bold: true };
    sheet.getRow(9).font = { bold: true };

    // Auto-width columns
    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    // Send as download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=burnt-report-${projectId}-${periodEnd}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  })
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getFirstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function getLastOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default router;
