import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../lib/api';
import MarginIndicator from '../ui/MarginIndicator';
import ApprovalActions from './ApprovalActions';

interface SOWSummary {
  id: string;
  title: string;
  customer_name: string;
  type: string;
  status: string;
  total_value: string;
  operating_margin_percent: string;
  created_by: string;
  start_date: string;
  end_date: string;
}

interface Props {
  sow: SOWSummary;
  onClose: () => void;
  onApprove: (sowId: string, comments?: string) => void;
  onReject: (sowId: string, comments: string) => void;
  actionLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  lean_tm: 'Lean T&M',
  elaborate_tm: 'Elaborate T&M',
  fixed_fee: 'Fixed Fee',
};

export default function SOWDetailPanel({ sow, onClose, onApprove, onReject, actionLoading }: Props) {
  const { data: detail } = useQuery({
    queryKey: ['sow-detail', sow.id],
    queryFn: async () => (await api.get(`/sows/${sow.id}`)).data,
  });

  const margin = parseFloat(sow.operating_margin_percent);

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{sow.id}</h2>
          <p className="text-sm text-gray-500">{sow.title}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">SOW Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{sow.customer_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium">{TYPE_LABELS[sow.type] ?? sow.type}</p>
            </div>
            <div>
              <p className="text-gray-500">Period</p>
              <p className="font-medium">{sow.start_date} to {sow.end_date}</p>
            </div>
            <div>
              <p className="text-gray-500">Created by</p>
              <p className="font-medium">{sow.created_by?.split('@')[0]}</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Financial Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-xl font-bold text-gray-900">${Number(sow.total_value).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Operating Margin</p>
                <div className="mt-1">
                  {margin > 0 ? <MarginIndicator value={margin} /> : <span className="text-gray-400">—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Lines */}
        {detail?.resourceLines && detail.resourceLines.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Resource Plan ({detail.resourceLines.length} lines)</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Role</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Location</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Hours</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.resourceLines.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{line.role_title ?? line.role_id}</td>
                      <td className="px-3 py-2">{line.location_name ?? line.location_id}</td>
                      <td className="px-3 py-2 text-right">{Number(line.hours).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${Number(line.bill_rate)}</td>
                      <td className="px-3 py-2 text-right font-medium">${Number(line.line_revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legal Clauses */}
        {detail?.legalClauses && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Legal Clauses</h3>
            <div className="space-y-2">
              {detail.legalClauses.autoInject?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Auto-injected ({detail.legalClauses.autoInject.length})</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {detail.legalClauses.autoInject.map((c: string) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.legalClauses.manualReview?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-yellow-700 mb-1">Manual review ({detail.legalClauses.manualReview.length})</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {detail.legalClauses.manualReview.map((c: string) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {sow.status === 'pending_approval' && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
            <ApprovalActions
              onApprove={(comments) => onApprove(sow.id, comments)}
              onReject={(comments) => onReject(sow.id, comments)}
              loading={actionLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
