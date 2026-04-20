import { Trash2, Plus } from 'lucide-react';

export interface ResourceLine {
  roleId: string;
  locationId: string;
  resourceId?: string;
  hours: number;
  billRate: number;
}

interface Role {
  id: string;
  title: string;
  standardRates: { locationId: string; locationName: string; billRate: number }[];
}

interface ResourceLineTableProps {
  lines: ResourceLine[];
  roles: Role[];
  locations: { id: string; name: string }[];
  onChange: (lines: ResourceLine[]) => void;
}

export default function ResourceLineTable({ lines, roles, locations, onChange }: ResourceLineTableProps) {
  const addLine = () => {
    onChange([...lines, { roleId: '', locationId: '', hours: 0, billRate: 0 }]);
  };

  const removeLine = (idx: number) => {
    onChange(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof ResourceLine, value: string | number) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-suggest bill rate when role+location changes
    if (field === 'roleId' || field === 'locationId') {
      const line = updated[idx];
      const role = roles.find((r) => r.id === line.roleId);
      const rate = role?.standardRates.find((r) => r.locationId === line.locationId);
      if (rate) updated[idx].billRate = rate.billRate;
    }

    onChange(updated);
  };

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-28">Hours</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-32">Bill Rate ($/hr)</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-28">Revenue</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">
                No resource lines added yet
              </td>
            </tr>
          ) : (
            lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <select
                    value={line.roleId}
                    onChange={(e) => updateLine(idx, 'roleId', e.target.value)}
                    className="w-full rounded border-gray-300 text-sm"
                  >
                    <option value="">Select role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={line.locationId}
                    onChange={(e) => updateLine(idx, 'locationId', e.target.value)}
                    className="w-full rounded border-gray-300 text-sm"
                  >
                    <option value="">Select...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={line.hours || ''}
                    onChange={(e) => updateLine(idx, 'hours', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={line.billRate || ''}
                    onChange={(e) => updateLine(idx, 'billRate', parseFloat(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 font-medium">
                  ${(line.hours * line.billRate).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeLine(idx)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
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
        onClick={addLine}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <Plus size={16} />
        Add Resource Line
      </button>

      {lines.length > 0 && (
        <div className="mt-3 text-right text-sm font-semibold text-gray-700">
          Total: ${lines.reduce((sum, l) => sum + l.hours * l.billRate, 0).toLocaleString()}
        </div>
      )}
    </div>
  );
}
