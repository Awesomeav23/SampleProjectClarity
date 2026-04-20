import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import FinancialImpactPreview from '../../components/changeOrder/FinancialImpactPreview';

interface Line {
  roleId: string;
  resourceId: string;
  hours: number;
  billRate: number;
}

const EMPTY_LINE: Line = { roleId: '', resourceId: '', hours: 0, billRate: 0 };

export default function ChangeOrderForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [sowId, setSowId] = useState('');
  const [type, setType] = useState<'timeline' | 'resource' | 'scope'>('timeline');
  const [description, setDescription] = useState('');
  const [additions, setAdditions] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [credits, setCredits] = useState<Line[]>([]);

  // Get active SOWs
  const { data: sows = [] } = useQuery({
    queryKey: ['sows-active'],
    queryFn: async () => {
      const { data } = await api.get('/sows?status=active');
      // Also get approved and signed SOWs
      const approved = await api.get('/sows?status=approved');
      const signed = await api.get('/sows?status=signed');
      return [...data, ...approved.data, ...signed.data];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  });

  const selectedSOW = sows.find((s: any) => s.id === sowId);
  const originalValue = selectedSOW ? parseFloat(selectedSOW.total_value) : 0;

  const updateLine = (list: Line[], setList: (l: Line[]) => void, idx: number, field: keyof Line, value: string | number) => {
    const updated = [...list];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-suggest bill rate from role
    if (field === 'roleId') {
      const role = roles.find((r: any) => r.id === value);
      const rate = role?.standardRates?.[0];
      if (rate) updated[idx].billRate = rate.billRate;
    }

    setList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sowId || !description) return;

    const validAdditions = additions.filter(l => l.hours > 0 && l.billRate > 0);
    const validCredits = credits.filter(l => l.hours > 0 && l.billRate > 0);

    if (validAdditions.length === 0 && validCredits.length === 0) {
      toast.error('Add at least one addition or credit line');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/change-orders', {
        sowId,
        type,
        description,
        additions: validAdditions,
        credits: validCredits,
      });
      toast.success(`Change order ${data.id} created — net impact: $${data.netImpact.toLocaleString()}`);
      navigate('/change-orders');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create change order');
    } finally {
      setSubmitting(false);
    }
  };

  const renderLineTable = (
    title: string,
    lines: Line[],
    setLines: (l: Line[]) => void,
    colorClass: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold ${colorClass}`}>{title}</h3>
        <button
          type="button"
          onClick={() => setLines([...lines, { ...EMPTY_LINE }])}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Plus size={14} /> Add Line
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-28">Hours</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-32">Bill Rate</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-28">Total</th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-400">No lines</td>
            </tr>
          ) : (
            lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <select
                    value={line.roleId}
                    onChange={(e) => updateLine(lines, setLines, idx, 'roleId', e.target.value)}
                    className="w-full rounded border-gray-300 text-sm"
                  >
                    <option value="">Select role...</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={line.hours || ''}
                    onChange={(e) => updateLine(lines, setLines, idx, 'hours', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={line.billRate || ''}
                    onChange={(e) => updateLine(lines, setLines, idx, 'billRate', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2 text-sm font-medium text-gray-700">
                  ${(line.hours * line.billRate).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Change Order</h1>
        <p className="text-sm text-gray-500">Modify an active SOW — additions, credits, and financial impact</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SOW *</label>
                <select
                  value={sowId}
                  onChange={(e) => setSowId(e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                  required
                >
                  <option value="">Select an active SOW...</option>
                  {sows.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.title} (${Number(s.total_value).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Change Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border-gray-300"
                  >
                    <option value="timeline">Timeline</option>
                    <option value="resource">Resource</option>
                    <option value="scope">Scope</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what's changing and why..."
                  className="w-full rounded-lg border-gray-300"
                  required
                />
              </div>
            </div>

            {/* Additions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {renderLineTable('Additions (new hours/cost)', additions, setAdditions, 'text-red-700')}
            </div>

            {/* Credits */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {renderLineTable('Credits (removed/reduced hours)', credits, setCredits, 'text-green-700')}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !sowId || !description}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Change Order'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/change-orders')}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar — Financial Impact */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Impact</h3>
            <FinancialImpactPreview
              additions={additions}
              credits={credits}
              originalSOWValue={originalValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
