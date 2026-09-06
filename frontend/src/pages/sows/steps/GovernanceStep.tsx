import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

interface Props {
  formData: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  msaId: string | null;
  templateType: string;
  customerId: string;
}

export default function GovernanceStep({ formData, onChange, msaId, templateType }: Props) {
  const { data: resources = [] } = useQuery({
    queryKey: ['resources', 'pm'],
    queryFn: async () => {
      const { data } = await api.get('/resources?roleId=ROLE-005');
      return data;
    },
  });

  const { data: clauseData } = useQuery({
    queryKey: ['clauses', msaId, templateType],
    queryFn: async () => {
      if (!msaId || !templateType) return null;
      const { data } = await api.get(`/msas/${msaId}/clauses?templateType=${templateType}`);
      return data;
    },
    enabled: !!msaId && !!templateType,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DynPro Project Manager *</label>
          <select
            value={formData.dynproPm ?? ''}
            onChange={(e) => onChange({ dynproPm: e.target.value })}
            className="w-full rounded-lg border-gray-300"
          >
            <option value="">Select PM...</option>
            {resources.map((r: any) => (
              <option key={r.id} value={r.email}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Project Manager *</label>
          <input
            value={formData.customerPm ?? ''}
            onChange={(e) => onChange({ customerPm: e.target.value })}
            placeholder="Customer PM name"
            className="w-full rounded-lg border-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status Reporting Frequency</label>
        <select
          value={formData.statusReporting ?? 'weekly'}
          onChange={(e) => onChange({ statusReporting: e.target.value })}
          className="w-full rounded-lg border-gray-300"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Path</label>
        <textarea
          value={formData.escalationPath ?? 'Level 1: Project Manager\nLevel 2: BU Head\nLevel 3: CRO / Executive Leadership'}
          onChange={(e) => onChange({ escalationPath: e.target.value })}
          rows={3}
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      {/* Legal Clauses */}
      {clauseData && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Legal Clauses (from MSA)</h4>

          {clauseData.summary?.autoInject?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">Auto-injected</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {clauseData.summary.autoInject.map((title: string) => (
                  <li key={title} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {clauseData.summary?.manualReview?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-yellow-700 mb-1">Requires Manual Review</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {clauseData.summary.manualReview.map((title: string) => (
                  <li key={title} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {clauseData.summary?.blocked?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Blocked — requires custom drafting</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {clauseData.summary.blocked.map((title: string) => (
                  <li key={title} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
