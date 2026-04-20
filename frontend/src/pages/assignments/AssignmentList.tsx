import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { Can } from '../../lib/permissions';
import DataTable, { type Column } from '../../components/ui/DataTable';

interface Assignment {
  id: string;
  resource_name: string;
  project_name: string;
  customer_name: string;
  allocation_percent: number;
  bill_rate: string;
  status: string;
  jobdiva_assignment_id: string | null;
  capacity_warning: string | null;
  approver_email: string;
  submitted_by: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AssignmentList() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/assignments${params}`);
      return data;
    },
  });

  const columns: Column<Assignment>[] = [
    { key: 'id', header: 'ID', sortable: true, className: 'w-32' },
    { key: 'resource_name', header: 'Resource', sortable: true },
    { key: 'project_name', header: 'Project', sortable: true },
    { key: 'customer_name', header: 'Customer', sortable: true },
    {
      key: 'allocation_percent', header: 'Allocation', sortable: true,
      render: (row) => <span className="font-medium">{row.allocation_percent}%</span>,
    },
    {
      key: 'bill_rate', header: 'Rate',
      render: (row) => `$${Number(row.bill_rate)}/hr`,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? 'bg-gray-100'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'jobdiva_assignment_id', header: 'JobDiva ID',
      render: (row) => row.jobdiva_assignment_id ? (
        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{row.jobdiva_assignment_id}</span>
      ) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'capacity_warning', header: 'Warnings',
      render: (row) => row.capacity_warning ? (
        <span className="text-xs text-yellow-700" title={row.capacity_warning}>⚠️</span>
      ) : null,
      className: 'w-16 text-center',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">{assignments.length} assignment records</p>
        </div>
        <Can permission="assignment:create">
          <Link
            to="/assignments/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create Assignment
          </Link>
        </Can>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['', 'submitted', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Loading...</p>
      ) : (
        <DataTable columns={columns} data={assignments} keyField="id" />
      )}
    </div>
  );
}
