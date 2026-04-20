import clsx from 'clsx';

interface UtilizationBarProps {
  percent: number;
  showLabel?: boolean;
}

function getUtilColor(percent: number) {
  if (percent > 100) return 'bg-red-500';
  if (percent >= 80) return 'bg-yellow-500';
  if (percent > 0) return 'bg-green-500';
  return 'bg-gray-300';
}

function getStatusLabel(percent: number) {
  if (percent > 100) return 'Over-allocated';
  if (percent >= 80) return 'High';
  if (percent > 0) return 'Available';
  return 'Bench';
}

export default function UtilizationBar({ percent, showLabel = true }: UtilizationBarProps) {
  const cappedWidth = Math.min(percent, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', getUtilColor(percent))}
          style={{ width: `${cappedWidth}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-12 text-right">{percent}%</span>
      {showLabel && (
        <span className="text-xs text-gray-500 w-24">{getStatusLabel(percent)}</span>
      )}
    </div>
  );
}
