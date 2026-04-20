import { Check, Clock } from 'lucide-react';
import clsx from 'clsx';

interface ApprovalChainProps {
  approvers: string[];
  approvalLevel: string;
  currentIndex?: number; // which approver is currently active (-1 = not started)
}

export default function ApprovalChain({ approvers, approvalLevel, currentIndex = -1 }: ApprovalChainProps) {
  const levelColor =
    approvalLevel === 'Standard' ? 'text-green-700 bg-green-50' :
    approvalLevel === 'Escalated' ? 'text-yellow-700 bg-yellow-50' :
    'text-red-700 bg-red-50';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Approval Route</h4>
        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', levelColor)}>
          {approvalLevel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {approvers.map((approver, idx) => {
          const isComplete = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    isComplete && 'bg-green-500 text-white',
                    isCurrent && 'bg-indigo-500 text-white',
                    isPending && 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isComplete ? <Check size={12} /> : <Clock size={12} />}
                </span>
                <span
                  className={clsx(
                    'text-sm',
                    isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'
                  )}
                >
                  {approver.split('@')[0]}
                </span>
              </div>
              {idx < approvers.length - 1 && (
                <div className={clsx('w-8 h-0.5', isComplete ? 'bg-green-500' : 'bg-gray-200')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
