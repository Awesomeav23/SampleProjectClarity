import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { Can } from '../../lib/permissions';
import DataTable, { type Column } from '../../components/ui/DataTable';
import MarginIndicator from '../../components/ui/MarginIndicator';

interface SOW {
  id: string;
  title: string;
  customer_name: string;
  type: string;
  status: string;
  total_value: string;
  operating_margin_percent: string;
  created_by: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  signed: 'bg-blue-100 text-blue-700',
  active: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<string, string> = {
  lean_tm: 'Lean T&M',
  elaborate_tm: 'Elaborate T&M',
  fixed_fee: 'Fixed Fee',
};

export default function SOWList() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: sows = [], isLoading } = useQuery<SOW[]>({
    queryKey: ['sows', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/sows${params}`);
      return data;
    },
  });

  const columns: Column<SOW>[] = [
    { key: 'id', header: 'ID', sortable: true, className: 'w-28' },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'customer_name', header: 'Customer', sortable: true },
    {
      key: 'type', header: 'Type',
      render: (row) => <span className="text-xs">{TYPE_LABELS[row.type] ?? row.type}</span>,
    },
    {
      key: 'total_value', header: 'Value', sortable: true,
      render: (row) => `$${Number(row.total_value).toLocaleString()}`,
    },
    {
      key: 'operating_margin_percent', header: 'Margin',
      render: (row) => {
        const val = parseFloat(row.operating_margin_percent);
        return val > 0 ? <MarginIndicator value={val} showLabel={false} /> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'status', header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? 'bg-gray-100'}`}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statements of Work</h1>
          <p className="text-sm text-gray-500">{sows.length} SOWs</p>
        </div>
        <Can permission="sow:create">
          <Link
            to="/sows/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create SOW
          </Link>
        </Can>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['', 'draft', 'pending_approval', 'approved', 'signed', 'active'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Loading...</p>
      ) : (
        <DataTable columns={columns} data={sows} keyField="id" />
      )}
    </div>
  );
}
