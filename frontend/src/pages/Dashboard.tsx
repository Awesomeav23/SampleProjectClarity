import { useAuth } from '../lib/auth';
import StatCard from '../components/ui/StatCard';
import AlertBanner from '../components/ui/AlertBanner';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500">
          {user?.roleName} &middot; Project Clarity Dashboard
        </p>
      </div>

      {/* Alerts */}
      <div className="space-y-2 mb-6">
        <AlertBanner type="warning" message="2 resources are over 100% utilization" />
        <AlertBanner type="info" message="1 resource on bench — available for assignment" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active SOWs" value={5} color="blue" />
        <StatCard label="Active Resources" value={12} color="green" />
        <StatCard label="Avg Utilization" value="78%" color="yellow" />
        <StatCard label="Pipeline Value" value="$1.2M" color="purple" />
      </div>

      {/* Pending Approvals - placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
        <p className="text-sm text-gray-500">No pending approvals at this time.</p>
      </div>

      {/* Recent Activity - placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            'SOW-001 (SurveyMonkey) — Change Order CO-001 approved',
            'Assignment: Romy Sharma → SurveyMonkey Integration (100%)',
            'SOW-004 (TechCorp) — Signed via DocuSign',
            'Timesheet sync completed — 10 entries updated',
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="text-gray-600">{activity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
