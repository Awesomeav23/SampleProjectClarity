import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import ResourceSnapshot from '../../components/assignment/ResourceSnapshot';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    resourceId: '',
    projectId: '',
    startDate: '',
    endDate: '',
    allocationPercent: 100,
    billRate: 0,
    approverEmail: '',
    notes: '',
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => (await api.get('/resources')).data,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  });

  // Auto-suggest bill rate when resource is selected
  const handleResourceChange = (resourceId: string) => {
    setForm((f) => ({ ...f, resourceId }));

    const resource = resources.find((r: any) => r.id === resourceId);
    if (resource) {
      // Find standard bill rate for this resource's role + location
      const role = roles.find((r: any) => r.id === resource.role_id);
      const rate = role?.standardRates?.find((r: any) => r.locationId === resource.location_id);
      if (rate) {
        setForm((f) => ({ ...f, resourceId, billRate: rate.billRate }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await api.post('/assignments', {
        ...form,
        allocationPercent: Number(form.allocationPercent),
        billRate: Number(form.billRate),
      });

      if (data.warnings?.length > 0) {
        data.warnings.forEach((w: string) => toast(w, { icon: '⚠️', duration: 5000 }));
      }

      toast.success(`Assignment created: ${data.id}`);
      navigate('/assignments');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
        <p className="text-sm text-gray-500">Assign a resource to a project — replaces the manual email workflow</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource *</label>
              <select
                value={form.resourceId}
                onChange={(e) => handleResourceChange(e.target.value)}
                className="w-full rounded-lg border-gray-300"
                required
              >
                <option value="">Select resource...</option>
                {resources.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.role_title} ({r.location_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                className="w-full rounded-lg border-gray-300"
                required
              >
                <option value="">Select project...</option>
                {/* Use resources endpoint projects or hardcode from capacity */}
                <option value="P001">SurveyMonkey Integration</option>
                <option value="P002">Acme CRM Migration</option>
                <option value="P003">Globex Data Platform</option>
                <option value="P004">TechCorp Cloud Migration</option>
                <option value="P006">RetailMax Inventory System</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border-gray-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border-gray-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocation % *</label>
                <input
                  type="number"
                  value={form.allocationPercent}
                  onChange={(e) => setForm((f) => ({ ...f, allocationPercent: parseInt(e.target.value) || 0 }))}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full rounded-lg border-gray-300"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">10-100%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Rate ($/hr) *</label>
                <input
                  type="number"
                  value={form.billRate || ''}
                  onChange={(e) => setForm((f) => ({ ...f, billRate: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  className="w-full rounded-lg border-gray-300"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Auto-suggested from role/location standard rate</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approver Email *</label>
              <input
                type="email"
                value={form.approverEmail}
                onChange={(e) => setForm((f) => ({ ...f, approverEmail: e.target.value }))}
                placeholder="e.g., marcus.johnson@dynpro.com"
                className="w-full rounded-lg border-gray-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional notes about this assignment..."
                className="w-full rounded-lg border-gray-300"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !form.resourceId || !form.projectId}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Submit Assignment'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/assignments')}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar — Resource Snapshot */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resource Snapshot</h3>
            <ResourceSnapshot
              resourceId={form.resourceId}
              newAllocationPercent={form.allocationPercent}
              startDate={form.startDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
