import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FolderOpen, Building2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import CapacityAlerts from '../../components/capacity/CapacityAlerts';
import ResourceView from './ResourceView';
import ProjectView from './ProjectView';
import PracticeView from './PracticeView';

type ViewType = 'resource' | 'project' | 'practice';

const TABS: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'resource', label: 'Resource View', icon: <Users size={16} /> },
  { key: 'project', label: 'Project View', icon: <FolderOpen size={16} /> },
  { key: 'practice', label: 'Practice View', icon: <Building2 size={16} /> },
];

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export default function CapacityDashboard() {
  const [view, setView] = useState<ViewType>('resource');
  const [weekStart, setWeekStart] = useState(getMondayOfCurrentWeek());
  const [locationFilter, setLocationFilter] = useState('');
  const [practiceFilter, setPracticeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['capacity', view, weekStart, locationFilter, practiceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ view, weekStart });
      if (locationFilter) params.set('locationId', locationFilter);
      if (practiceFilter) params.set('buPractice', practiceFilter);
      const { data } = await api.get(`/capacity?${params}`);
      return data;
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Capacity Dashboard</h1>
        <p className="text-sm text-gray-500">Resource utilization and availability</p>
      </div>

      {/* Alerts */}
      <CapacityAlerts weekStart={weekStart} />

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        {/* Tab Toggle */}
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                view === tab.key
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs text-gray-500 mr-1">Week of</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded-lg border-gray-300 text-sm py-1.5"
            />
          </div>

          {view === 'resource' && (
            <>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="rounded-lg border-gray-300 text-sm py-1.5"
              >
                <option value="">All Locations</option>
                <option value="LOC-US">United States</option>
                <option value="LOC-IN-PUNE">India - Pune</option>
                <option value="LOC-IN-MOHALI">India - Mohali</option>
              </select>

              <select
                value={practiceFilter}
                onChange={(e) => setPracticeFilter(e.target.value)}
                className="rounded-lg border-gray-300 text-sm py-1.5"
              >
                <option value="">All Practices</option>
                <option value="Engineering">Engineering</option>
                <option value="Delivery">Delivery</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Design">Design</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Loading capacity data...</p>
      ) : (
        <>
          {view === 'resource' && <ResourceView data={data?.data ?? []} />}
          {view === 'project' && <ProjectView data={data?.data ?? []} />}
          {view === 'practice' && <PracticeView data={data?.data ?? []} />}
        </>
      )}
    </div>
  );
}
