interface Props {
  formData: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
}

export default function ScopeStep({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scope Overview *</label>
        <textarea
          value={formData.scopeOverview ?? ''}
          onChange={(e) => onChange({ scopeOverview: e.target.value })}
          rows={4}
          placeholder="Describe the scope of work..."
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">In-Scope Deliverables *</label>
        <textarea
          value={formData.inScopeItems ?? ''}
          onChange={(e) => onChange({ inScopeItems: e.target.value })}
          rows={4}
          placeholder="List all deliverables included..."
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-Scope Items *</label>
        <textarea
          value={formData.outOfScopeItems ?? ''}
          onChange={(e) => onChange({ outOfScopeItems: e.target.value })}
          rows={3}
          placeholder="Explicitly list what is NOT included..."
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions *</label>
        <textarea
          value={formData.assumptions ?? ''}
          onChange={(e) => onChange({ assumptions: e.target.value })}
          rows={3}
          placeholder="List key assumptions..."
          className="w-full rounded-lg border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies</label>
        <textarea
          value={formData.dependencies ?? ''}
          onChange={(e) => onChange({ dependencies: e.target.value })}
          rows={2}
          placeholder="External dependencies or prerequisites (optional)..."
          className="w-full rounded-lg border-gray-300"
        />
      </div>
    </div>
  );
}
