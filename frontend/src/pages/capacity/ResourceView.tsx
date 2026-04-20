import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import UtilizationBar from '../../components/ui/UtilizationBar';

interface ResourceCapacity {
  resourceId: string;
  resourceName: string;
  roleTitle: string;
  locationName: string;
  buPractice: string;
  utilizationPercent: number;
  status: string;
  allocations: {
    projectId: string;
    projectName: string;
    allocationPercent: number;
    hours: number;
  }[];
}

interface Props {
  data: ResourceCapacity[];
}

export default function ResourceView({ data }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => b.utilizationPercent - a.utilizationPercent);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8"></th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resource</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Practice</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-48">Utilization</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Projects</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((r) => {
            const isExpanded = expandedId === r.resourceId;
            return (
              <Fragment key={r.resourceId}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : r.resourceId)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400">
                    {r.allocations.length > 0 ? (
                      isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.resourceName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.roleTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.locationName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.buPractice}</td>
                  <td className="px-4 py-3">
                    <UtilizationBar percent={r.utilizationPercent} showLabel={false} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{r.allocations.length}</td>
                </tr>
                {isExpanded && r.allocations.length > 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-3 bg-gray-50">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Project Allocations</p>
                        {r.allocations.map((a) => (
                          <div key={a.projectId} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{a.projectName}</span>
                            <span className="text-gray-500">
                              {a.allocationPercent}% ({a.hours} hrs/week)
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { Fragment } from 'react';
