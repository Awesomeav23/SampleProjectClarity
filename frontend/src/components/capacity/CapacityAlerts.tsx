import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import AlertBanner from '../ui/AlertBanner';

interface Props {
  weekStart: string;
}

export default function CapacityAlerts({ weekStart }: Props) {
  const { data } = useQuery({
    queryKey: ['capacity-alerts', weekStart],
    queryFn: async () => (await api.get(`/capacity/alerts?weekStart=${weekStart}`)).data,
  });

  if (!data) return null;

  const overCount = data.overAllocated?.length ?? 0;
  const benchCount = data.underUtilized?.filter((r: any) => r.type === 'bench').length ?? 0;
  const underCount = data.underUtilized?.filter((r: any) => r.type === 'under_utilized').length ?? 0;

  if (overCount === 0 && benchCount === 0 && underCount === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {overCount > 0 && (
        <AlertBanner
          type="danger"
          message={`${overCount} resource${overCount > 1 ? 's' : ''} over 100% utilization: ${data.overAllocated.map((r: any) => `${r.resourceName} (${r.utilizationPercent}%)`).join(', ')}`}
        />
      )}
      {benchCount > 0 && (
        <AlertBanner
          type="info"
          message={`${benchCount} resource${benchCount > 1 ? 's' : ''} on bench — available for assignment: ${data.underUtilized.filter((r: any) => r.type === 'bench').map((r: any) => r.resourceName).join(', ')}`}
        />
      )}
      {underCount > 0 && (
        <AlertBanner
          type="warning"
          message={`${underCount} resource${underCount > 1 ? 's' : ''} under-utilized (<60%): ${data.underUtilized.filter((r: any) => r.type === 'under_utilized').map((r: any) => `${r.resourceName} (${r.utilizationPercent}%)`).join(', ')}`}
        />
      )}
    </div>
  );
}
