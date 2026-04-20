import type { ResourceLine } from '../../../components/sow/ResourceLineTable';
import MarginIndicator from '../../../components/ui/MarginIndicator';
import ApprovalChain from '../../../components/ui/ApprovalChain';

interface MarginResult {
  totalRevenue: number;
  totalCost: number;
  marginPercent: number;
  approvalLevel: string;
  approvers: string[];
}

interface Props {
  customerId: string;
  customerName: string;
  templateId: string;
  title: string;
  startDate: string;
  endDate: string;
  formData: Record<string, any>;
  resourceLines: ResourceLine[];
  marginResult: MarginResult | null;
}

export default function ReviewStep({
  customerName,
  templateId,
  title,
  startDate,
  endDate,
  formData,
  resourceLines,
  marginResult,
}: Props) {
  const templateName =
    templateId === 'TPL-LEAN-TM' ? 'Lean T&M' :
    templateId === 'TPL-ELAB-TM' ? 'Elaborate T&M' :
    templateId === 'TPL-FIXED-FEE' ? 'Fixed Fee' : templateId;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review SOW before submitting</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Customer & Engagement</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Customer:</span> {customerName}</p>
            <p><span className="text-gray-500">Template:</span> {templateName}</p>
            <p><span className="text-gray-500">Title:</span> {title}</p>
            <p><span className="text-gray-500">Period:</span> {startDate} to {endDate}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Governance</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">DynPro PM:</span> {formData.dynproPm ?? '—'}</p>
            <p><span className="text-gray-500">Customer PM:</span> {formData.customerPm ?? '—'}</p>
            <p><span className="text-gray-500">Reporting:</span> {formData.statusReporting ?? 'Weekly'}</p>
          </div>
        </div>
      </div>

      {/* Resource Plan Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Resource Plan ({resourceLines.length} lines)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-lg font-bold">{resourceLines.reduce((s, l) => s + l.hours, 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold">${marginResult?.totalRevenue.toLocaleString() ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Operating Margin</p>
            {marginResult ? (
              <MarginIndicator value={marginResult.marginPercent} />
            ) : (
              <p className="text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Scope Summary */}
      {formData.scopeOverview && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Scope</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.scopeOverview}</p>
        </div>
      )}

      {/* Approval Route */}
      {marginResult && (
        <ApprovalChain
          approvers={marginResult.approvers}
          approvalLevel={marginResult.approvalLevel}
        />
      )}
    </div>
  );
}
