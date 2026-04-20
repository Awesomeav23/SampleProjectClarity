import clsx from 'clsx';

interface Line {
  hours: number;
  billRate: number;
}

interface Props {
  additions: Line[];
  credits: Line[];
  originalSOWValue: number;
}

export default function FinancialImpactPreview({ additions, credits, originalSOWValue }: Props) {
  const additionsTotal = additions.reduce((sum, l) => sum + l.hours * l.billRate, 0);
  const creditsTotal = credits.reduce((sum, l) => sum + l.hours * l.billRate, 0);
  const netImpact = additionsTotal - creditsTotal;
  const updatedValue = originalSOWValue + netImpact;

  const hasData = additions.some(l => l.hours > 0) || credits.some(l => l.hours > 0);

  if (!hasData) {
    return (
      <div className="text-sm text-gray-400 text-center py-8">
        Add lines to see financial impact
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Additions</span>
          <span className="font-medium text-red-600">+${additionsTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Credits</span>
          <span className="font-medium text-green-600">-${creditsTotal.toLocaleString()}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="text-sm font-semibold text-gray-700">Net Impact</span>
          <span className={clsx('font-bold text-lg', netImpact >= 0 ? 'text-red-600' : 'text-green-600')}>
            {netImpact >= 0 ? '+' : ''}${netImpact.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Original SOW Value</span>
          <span className="font-medium text-gray-700">${originalSOWValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-700">Updated SOW Value</span>
          <span className="font-bold text-lg text-gray-900">${updatedValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Approval hint */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          Approval will be routed based on the SOW's current margin threshold after this change is applied.
        </p>
      </div>
    </div>
  );
}
