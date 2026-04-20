import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import DataTable, { type Column } from '../../components/ui/DataTable';
import MarginIndicator from '../../components/ui/MarginIndicator';
import SOWDetailPanel from '../../components/sow/SOWDetailPanel';

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
  start_date: string;
  end_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  signed: 'bg-blue-100 text-blue-700',
  active: 'bg-indigo-100 text-indigo-700',
};

const TYPE_LABELS: Record<string, string> = {
  lean_tm: 'Lean T&M',
  elaborate_tm: 'Elaborate T&M',
  fixed_fee: 'Fixed Fee',
};

export default function SOWApprovals() {
  const [selectedSOW, setSelectedSOW] = useState<SOW | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const queryClient = useQueryClient();

  const { data: sows = [], isLoading } = useQuery<SOW[]>({
    queryKey: ['sows', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/sows${params}`);
      return data;
    },
  });

  const handleApprove = async (sowId: string, comments?: string) => {
    setActionLoading(true);
    try {
      await api.post(`/sows/${sowId}/approve`, { comments });
      toast.success(`SOW ${sowId} approved`);
      setSelectedSOW(null);
      queryClient.invalidateQueries({ queryKey: ['sows'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (sowId: string, comments: string) => {
    setActionLoading(true);
    try {
      await api.post(`/sows/${sowId}/reject`, { comments });
      toast.success(`SOW ${sowId} rejected`);
      setSelectedSOW(null);
      queryClient.invalidateQueries({ queryKey: ['sows'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

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
      key: 'created_by', header: 'Submitted By',
      render: (row) => <span className="text-sm">{row.created_by?.split('@')[0]}</span>,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SOW Approvals</h1>
        <p className="text-sm text-gray-500">Review and approve pending statements of work</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-3 mb-4">
        {[
          { value: 'pending_approval', label: 'Pending Approval' },
          { value: '', label: 'All' },
          { value: 'approved', label: 'Approved' },
          { value: 'draft', label: 'Draft' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.value === 'pending_approval' && sows.length > 0 && statusFilter === f.value && (
              <span className="ml-1.5 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {sows.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={sows}
          keyField="id"
          onRowClick={(row) => setSelectedSOW(row)}
          emptyMessage="No SOWs matching this filter"
        />
      )}

      {/* Detail Panel */}
      {selectedSOW && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedSOW(null)}
          />
          <SOWDetailPanel
            sow={selectedSOW}
            onClose={() => setSelectedSOW(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
          />
        </>
      )}
    </div>
  );
}
