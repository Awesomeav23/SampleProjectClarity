import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

interface Props {
  customerId: string;
  onChange: (customerId: string) => void;
  autoPopulated: Record<string, any>;
  onAutoPopulate: (data: Record<string, any>) => void;
}

export default function CustomerStep({ customerId, onChange, autoPopulated, onAutoPopulate }: Props) {
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data,
  });

  const handleCustomerChange = async (id: string) => {
    onChange(id);
    if (id) {
      const { data } = await api.get(`/customers/${id}`);
      onAutoPopulate({
        customerName: data.name,
        msaId: data.msa?.id ?? null,
        paymentTerms: data.msa?.payment_terms ?? data.payment_terms,
        primaryContactName: data.primary_contact_name,
        primaryContactEmail: data.primary_contact_email,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select
          value={customerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className="w-full rounded-lg border-gray-300"
        >
          <option value="">Select customer...</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Selecting a customer auto-populates MSA, payment terms, and contact</p>
      </div>

      {customerId && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Auto-populated from customer</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500">MSA</label>
              <p className="text-sm font-medium">{autoPopulated.msaId ?? 'No active MSA'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Payment Terms</label>
              <p className="text-sm font-medium">{autoPopulated.paymentTerms ?? '—'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Contact Name</label>
              <p className="text-sm font-medium">{autoPopulated.primaryContactName ?? '—'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Contact Email</label>
              <p className="text-sm font-medium">{autoPopulated.primaryContactEmail ?? '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
