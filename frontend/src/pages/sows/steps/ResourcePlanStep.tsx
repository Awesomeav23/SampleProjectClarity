import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import ResourceLineTable, { type ResourceLine } from '../../../components/sow/ResourceLineTable';
import MarginIndicator from '../../../components/ui/MarginIndicator';
import AlertBanner from '../../../components/ui/AlertBanner';

interface MarginResult {
  totalRevenue: number;
  totalCost: number;
  marginPercent: number;
  approvalLevel: string;
  approvers: string[];
  approvalDescription: string;
}

interface Props {
  sowId: string | null;
  resourceLines: ResourceLine[];
  onLinesChange: (lines: ResourceLine[]) => void;
  marginResult: MarginResult | null;
  onMarginChange: (result: MarginResult | null) => void;
}

export default function ResourcePlanStep({ sowId, resourceLines, onLinesChange, marginResult, onMarginChange }: Props) {
  const [calculating, setCalculating] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  });

  const locations = [
    { id: 'LOC-US', name: 'United States' },
    { id: 'LOC-IN-PUNE', name: 'India - Pune' },
    { id: 'LOC-IN-MOHALI', name: 'India - Mohali' },
  ];

  // Debounced margin calculation
  useEffect(() => {
    const validLines = resourceLines.filter((l) => l.roleId && l.locationId && l.hours > 0 && l.billRate > 0);
    if (validLines.length === 0 || !sowId) {
      onMarginChange(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const { data } = await api.post(`/sows/${sowId}/calculate-margin`, {
          resourceLines: validLines,
        });
        onMarginChange(data);
      } catch {
        // ignore calculation errors during editing
      } finally {
        setCalculating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [resourceLines, sowId]);

  return (
    <div className="space-y-6">
      <ResourceLineTable
        lines={resourceLines}
        roles={roles.map((r: any) => ({
          id: r.id,
          title: r.title,
          standardRates: r.standardRates ?? [],
        }))}
        locations={locations}
        onChange={onLinesChange}
      />

      {/* Margin Display */}
      {marginResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Financial Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">${marginResult.totalRevenue.toLocaleString()}</p>
            </div>
            {marginResult.totalCost > 0 && (
              <div>
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-lg font-bold text-gray-900">${marginResult.totalCost.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Operating Margin</p>
              <div className="mt-1">
                <MarginIndicator value={marginResult.marginPercent} />
              </div>
            </div>
          </div>

          {marginResult.marginPercent < 40 && (
            <AlertBanner
              type={marginResult.marginPercent < 35 ? 'danger' : 'warning'}
              message={`Margin ${marginResult.marginPercent}% is below 40% — ${marginResult.approvalDescription}`}
            />
          )}
        </div>
      )}

      {calculating && (
        <p className="text-sm text-gray-400 text-center">Calculating margin...</p>
      )}
    </div>
  );
}
