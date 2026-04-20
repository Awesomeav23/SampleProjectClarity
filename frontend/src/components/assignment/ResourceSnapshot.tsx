import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import UtilizationBar from '../ui/UtilizationBar';
import AlertBanner from '../ui/AlertBanner';

interface Props {
  resourceId: string;
  newAllocationPercent: number;
  startDate: string;
}

export default function ResourceSnapshot({ resourceId, newAllocationPercent, startDate }: Props) {
  const { data: capacity } = useQuery({
    queryKey: ['resource-capacity', resourceId, startDate],
    queryFn: async () => {
      if (!resourceId) return null;
      const { data } = await api.get(`/resources/${resourceId}/capacity?weekStart=${startDate || new Date().toISOString().slice(0, 10)}`);
      return data;
    },
    enabled: !!resourceId,
  });

  if (!resourceId) {
    return (
      <div className="text-sm text-gray-400 text-center py-8">
        Select a resource to see their capacity
      </div>
    );
  }

  if (!capacity) {
    return <div className="text-sm text-gray-400 text-center py-4">Loading...</div>;
  }

  const projectedTotal = capacity.utilizationPercent + newAllocationPercent;
  const wouldOverAllocate = projectedTotal > 100;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700">{capacity.resourceName}</h4>
        <p className="text-xs text-gray-500">Current week of {capacity.weekStart}</p>
      </div>

      {/* Current Utilization */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Current Utilization</p>
        <UtilizationBar percent={capacity.utilizationPercent} />
      </div>

      {/* Projected After Assignment */}
      {newAllocationPercent > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">After This Assignment</p>
          <UtilizationBar percent={projectedTotal} />
        </div>
      )}

      {/* Over-allocation Warning */}
      {wouldOverAllocate && newAllocationPercent > 0 && (
        <AlertBanner
          type="danger"
          message={`Will be at ${projectedTotal}% — over-allocated by ${projectedTotal - 100}%`}
        />
      )}

      {/* Active Projects */}
      {capacity.allocations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Active Projects</p>
          <div className="space-y-2">
            {capacity.allocations.map((a: any) => (
              <div key={a.projectId} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-700">{a.projectName}</span>
                <span className="text-gray-500 font-medium">{a.allocationPercent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {capacity.allocations.length === 0 && (
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
          Currently on bench — available for assignment
        </div>
      )}
    </div>
  );
}
