import clsx from 'clsx';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface AlertBannerProps {
  type: 'info' | 'warning' | 'danger';
  message: string;
}

const STYLES = {
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: Info },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: AlertTriangle },
  danger: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: AlertCircle },
};

export default function AlertBanner({ type, message }: AlertBannerProps) {
  const style = STYLES[type];
  const Icon = style.icon;

  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-lg border', style.bg, style.text)}>
      <Icon size={18} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
