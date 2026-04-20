import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { Can } from '../../lib/permissions';
import DataTable, { type Column } from '../../components/ui/DataTable';

interface ChangeOrder {
  id: string;
  sow_id: string;
  sow_title: string;
  customer_name: string;
  type: string;
  description: string;
  additions_total: string;
  credits_total: string;
  net_impact: string;
  status: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
};

const TYPE_LABELS: Record<string, string> = {
  timeline: 'Timeline',
  resource: 'Resource',
  scope: 'Scope',
};

export default function ChangeOrderList() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: changeOrders = [], isLoading } = useQuery<ChangeOrder[]>({
    queryKey: ['change-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/change-orders${params}`);
      return data;
    },
  });

  const columns: Column<ChangeOrder>[] = [
    { key: 'id', header: 'ID', sortable: true, className: 'w-28' },
    { key: 'sow_title', header: 'SOW', sortable: true },
    { key: 'customer_name', header: 'Customer', sortable: true },
    {
      key: 'type', header: 'Type',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {TYPE_LABELS[row.type] ?? row.type}
        </span>
      ),
    },
    {
      key: 'additions_total', header: 'Additions',
      render: (row) => <span className="text-red-600">+${Number(row.additions_total).toLocaleString()}</span>,
    },
    {
      key: 'credits_total', header: 'Credits',
      render: (row) => <span className="text-green-600">-${Number(row.credits_total).toLocaleString()}</span>,
    },
    {
      key: 'net_impact', header: 'Net Impact', sortable: true,
      render: (row) => {
        const val = Number(row.net_impact);
        return <span className="font-medium">{val >= 0 ? '+' : ''}${val.toLocaleString()}</span>;
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
    {
      key: 'created_by', header: 'Created By',
      render: (row) => <span className="text-sm">{row.created_by?.split('@')[0]}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change Orders</h1>
          <p className="text-sm text-gray-500">{changeOrders.length} change orders</p>
        </div>
        <Can permission="change_order:create">
          <Link
            to="/change-orders/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create Change Order
          </Link>
        </Can>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['', 'draft', 'pending_approval', 'approved'].map((s) => (
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
        <DataTable columns={columns} data={changeOrders} keyField="id" />
      )}
    </div>
  );
}
