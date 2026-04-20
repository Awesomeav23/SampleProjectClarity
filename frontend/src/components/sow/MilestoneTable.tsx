import { Trash2, Plus } from 'lucide-react';

export interface Milestone {
  name: string;
  deliverables: string;
  dueDate: string;
  acceptanceCriteria: string;
  paymentAmount: number;
}

interface MilestoneTableProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  totalSOWValue?: number;
}

export default function MilestoneTable({ milestones, onChange, totalSOWValue }: MilestoneTableProps) {
  const addMilestone = () => {
    onChange([
      ...milestones,
      { name: '', deliverables: '', dueDate: '', acceptanceCriteria: '', paymentAmount: 0 },
    ]);
  };

  const removeMilestone = (idx: number) => {
    onChange(milestones.filter((_, i) => i !== idx));
  };

  const updateMilestone = (idx: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const totalPayment = milestones.reduce((sum, m) => sum + m.paymentAmount, 0);
  const mismatch = totalSOWValue && totalSOWValue > 0 && Math.abs(totalPayment - totalSOWValue) > 0.01;

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Milestone</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Deliverables</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-36">Due Date</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-32">Payment ($)</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {milestones.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-400">
                No milestones added yet
              </td>
            </tr>
          ) : (
            milestones.map((m, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <input
                    value={m.name}
                    onChange={(e) => updateMilestone(idx, 'name', e.target.value)}
                    placeholder="Milestone name"
                    className="w-full rounded border-gray-300 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={m.deliverables}
                    onChange={(e) => updateMilestone(idx, 'deliverables', e.target.value)}
                    placeholder="Key deliverables"
                    className="w-full rounded border-gray-300 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)}
                    className="w-full rounded border-gray-300 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={m.paymentAmount || ''}
                    onChange={(e) => updateMilestone(idx, 'paymentAmount', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => removeMilestone(idx)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <button
        type="button"
        onClick={addMilestone}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <Plus size={16} />
        Add Milestone
      </button>

      {milestones.length > 0 && (
        <div className="mt-3 flex justify-between text-sm">
          <span className="font-semibold text-gray-700">
            Total Payment: ${totalPayment.toLocaleString()}
          </span>
          {mismatch && (
            <span className="text-red-600 font-medium">
              Must equal SOW value (${totalSOWValue?.toLocaleString()})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
