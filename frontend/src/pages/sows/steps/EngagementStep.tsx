import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

interface FormData {
  templateId: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}

export default function EngagementStep({ data, onChange }: Props) {
  const { data: templates = [] } = useQuery({
    queryKey: ['sow-templates'],
    queryFn: async () => (await api.get('/sow-templates')).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SOW Template *</label>
        <select
          value={data.templateId}
          onChange={(e) => onChange({ templateId: e.target.value })}
          className="w-full rounded-lg border-gray-300"
        >
          <option value="">Select template...</option>
          {templates.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.sectionCount} sections)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SOW Title *</label>
        <input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., SurveyMonkey Phase 2 Analytics"
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full rounded-lg border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="w-full rounded-lg border-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
