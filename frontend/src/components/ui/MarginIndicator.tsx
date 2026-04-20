import clsx from 'clsx';

interface MarginIndicatorProps {
  value: number;
  showLabel?: boolean;
}

function getMarginColor(value: number) {
  if (value >= 40) return { bg: 'bg-green-100', text: 'text-green-800', label: 'Healthy' };
  if (value >= 35) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Caution' };
  return { bg: 'bg-red-100', text: 'text-red-800', label: 'Low Margin' };
}

export default function MarginIndicator({ value, showLabel = true }: MarginIndicatorProps) {
  const style = getMarginColor(value);
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium', style.bg, style.text)}>
      {value.toFixed(1)}%
      {showLabel && <span className="text-xs opacity-75">({style.label})</span>}
    </span>
  );
}
