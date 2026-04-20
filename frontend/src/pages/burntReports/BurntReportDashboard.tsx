import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import VarianceChart from '../../components/burntReport/VarianceChart';
import MarginTrendChart from '../../components/burntReport/MarginTrendChart';

interface ReportSummary {
  reportId: string;
  projectId: string;
  projectName: string;
  customerName: string;
  overallStatus: string;
}

interface FullReport {
  reportId: string;
  projectName: string;
  customerName: string;
  baseline: {
    totalPlannedHours: number;
    totalPlannedRevenue: number;
    plannedMarginPercent: number;
  };
  actuals: {
    totalActualHours: number;
    totalActualRevenue: number;
    actualMarginPercent: number;
  };
  variance: {
    hoursVariance: number;
    hoursVariancePercent: number;
    revenueVariance: number;
    revenueVariancePercent: number;
    marginVariance: number;
    hoursStatus: string;
    marginStatus: string;
  };
  resourceDetails: {
    resourceId: string;
    resourceName: string;
    roleTitle: string;
    plannedHours: number;
    actualHours: number;
    hoursVariance: number;
    hoursVariancePercent: number;
    plannedRevenue: number;
    actualRevenue: number;
    revenueVariance: number;
    status: string;
  }[];
  overallStatus: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
};

function getFirstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function getLastOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function BurntReportDashboard() {
  const [selectedProject, setSelectedProject] = useState('');
  const [periodStart, setPeriodStart] = useState(getFirstOfMonth());
  const [periodEnd, setPeriodEnd] = useState(getLastOfMonth());

  // List all project summaries
  const { data: summaries = [] } = useQuery<ReportSummary[]>({
    queryKey: ['burnt-reports-list', periodStart, periodEnd],
    queryFn: async () => {
      const { data } = await api.get(`/burnt-reports?periodStart=${periodStart}&periodEnd=${periodEnd}`);
      return data;
    },
  });

  // Get detailed report for selected project
  const { data: report, isLoading: reportLoading } = useQuery<FullReport>({
    queryKey: ['burnt-report-detail', selectedProject, periodStart, periodEnd],
    queryFn: async () => {
      const { data } = await api.get(`/burnt-reports/${selectedProject}?periodStart=${periodStart}&periodEnd=${periodEnd}`);
      return data;
    },
    enabled: !!selectedProject,
  });

  const handleExport = async () => {
    if (!selectedProject) return;
    try {
      const response = await api.get(
        `/burnt-reports/${selectedProject}/export?periodStart=${periodStart}&periodEnd=${periodEnd}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `burnt-report-${selectedProject}-${periodEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // ignore export errors
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Burnt Reports</h1>
          <p className="text-sm text-gray-500">Baseline vs actuals — planned vs actual performance</p>
        </div>
        {selectedProject && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export Excel
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border-gray-300 text-sm min-w-[250px]"
          >
            <option value="">Select a project...</option>
            {summaries.map((s) => (
              <option key={s.projectId} value={s.projectId}>
                {s.projectName} ({s.customerName})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Period Start</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-lg border-gray-300 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Period End</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-lg border-gray-300 text-sm"
          />
        </div>
      </div>

      {/* Project summary list (when no project selected) */}
      {!selectedProject && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaries.map((s) => {
                const style = STATUS_COLORS[s.overallStatus] ?? STATUS_COLORS.green;
                return (
                  <tr
                    key={s.projectId}
                    onClick={() => setSelectedProject(s.projectId)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.customerName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', style.bg, style.text)}>
                        {s.overallStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed report */}
      {selectedProject && reportLoading && (
        <p className="text-gray-500 py-8 text-center">Loading report...</p>
      )}

      {selectedProject && report && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard label="Planned Hours" value={report.baseline.totalPlannedHours} color="blue" />
            <StatCard label="Actual Hours" value={report.actuals.totalActualHours} color="blue" />
            <StatCard
              label="Hours Variance"
              value={`${report.variance.hoursVariancePercent}%`}
              color={report.variance.hoursStatus === 'green' ? 'green' : report.variance.hoursStatus === 'yellow' ? 'yellow' : 'red'}
            />
            <StatCard label="Planned Margin" value={`${report.baseline.plannedMarginPercent}%`} color="purple" />
            <StatCard label="Actual Margin" value={`${report.actuals.actualMarginPercent}%`} color="purple" />
            <StatCard
              label="Overall Status"
              value={report.overallStatus.toUpperCase()}
              color={report.overallStatus === 'green' ? 'green' : report.overallStatus === 'yellow' ? 'yellow' : 'red'}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VarianceChart data={report.resourceDetails} />
            <MarginTrendChart
              plannedMargin={report.baseline.plannedMarginPercent}
              actualMargin={report.actuals.actualMarginPercent}
              projectName={report.projectName}
            />
          </div>

          {/* Resource Detail Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Per-Resource Breakdown</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Planned Hrs</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actual Hrs</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Variance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Var %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Planned Rev</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actual Rev</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.resourceDetails.map((rd) => {
                  const style = STATUS_COLORS[rd.status] ?? STATUS_COLORS.green;
                  return (
                    <tr key={rd.resourceId}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{rd.resourceName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rd.roleTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{rd.plannedHours}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{rd.actualHours}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        <span className={rd.hoursVariance < 0 ? 'text-red-600' : rd.hoursVariance > 0 ? 'text-green-600' : 'text-gray-500'}>
                          {rd.hoursVariance > 0 ? '+' : ''}{rd.hoursVariance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={rd.hoursVariancePercent < -5 ? 'text-red-600' : 'text-gray-600'}>
                          {rd.hoursVariancePercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${rd.plannedRevenue?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${rd.actualRevenue?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', style.bg, style.text)}>
                          {rd.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
