import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  subtitle?: string;
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  purple: 'bg-purple-50 text-purple-700',
  gray: 'bg-gray-50 text-gray-700',
};

export default function StatCard({ label, value, color = 'gray', subtitle }: StatCardProps) {
  return (
    <div className={clsx('rounded-xl p-4 border', COLOR_MAP[color])}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
    </div>
  );
}
