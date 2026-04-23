import { useQuery } from '@tanstack/react-query';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';

type ConnectorStatus = 'healthy' | 'degraded' | 'down';

interface ConnectorHealth {
  name: string;
  status: ConnectorStatus;
  latencyMs: number | null;
  lastCheckedAt: string;
  mode: 'mock' | 'live';
  details: Record<string, unknown>;
  error?: string;
}

interface QueueHealth {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  error?: string;
}

interface HealthResponse {
  overall: ConnectorStatus;
  checkedAt: string;
  mode: 'mock' | 'live';
  connectors: ConnectorHealth[];
  redis: {
    status: ConnectorStatus;
    host: string;
    port: number;
    error?: string;
  };
  queues: QueueHealth[];
}

const STATUS_STYLE: Record<ConnectorStatus, { bg: string; text: string; label: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Healthy' },
  degraded: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Degraded' },
  down: { bg: 'bg-red-100', text: 'text-red-700', label: 'Down' },
};

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const s = STATUS_STYLE[status];
  const Icon = status === 'healthy' ? CheckCircle2 : status === 'degraded' ? AlertTriangle : XCircle;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', s.bg, s.text)}>
      <Icon size={14} />
      {s.label}
    </span>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorHealth }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{connector.name}</h3>
          <p className="text-xs text-gray-500 uppercase">{connector.mode}</p>
        </div>
        <StatusBadge status={connector.status} />
      </div>
      <dl className="text-xs space-y-1">
        <div className="flex justify-between">
          <dt className="text-gray-500">Latency</dt>
          <dd className="text-gray-900 font-medium">
            {connector.latencyMs !== null ? `${connector.latencyMs} ms` : '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Last checked</dt>
          <dd className="text-gray-900">{new Date(connector.lastCheckedAt).toLocaleTimeString()}</dd>
        </div>
        {Object.entries(connector.details).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <dt className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
            <dd className="text-gray-900 font-medium">
              {typeof value === 'object' && value !== null
                ? Object.entries(value as Record<string, number>)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(', ') || '—'
                : String(value)}
            </dd>
          </div>
        ))}
      </dl>
      {connector.error && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{connector.error}</p>
      )}
    </div>
  );
}

export default function IntegrationHealth() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<HealthResponse>({
    queryKey: ['integration-health'],
    queryFn: async () => {
      const { data } = await api.get('/integration-health');
      return data;
    },
    refetchInterval: 30_000,
  });

  const totalFailed = data?.queues.reduce((n, q) => n + q.failed, 0) ?? 0;
  const totalActive = data?.queues.reduce((n, q) => n + q.active, 0) ?? 0;
  const totalWaiting = data?.queues.reduce((n, q) => n + q.waiting, 0) ?? 0;
  const totalCompleted = data?.queues.reduce((n, q) => n + q.completed, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Health</h1>
          <p className="text-sm text-gray-500">
            Live connector status, queue depth, and sync metrics
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading && <p className="text-gray-500 py-8 text-center">Loading health data…</p>}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load integration health. Ensure you have <code>admin:system_config</code> permission.
        </div>
      )}

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl p-4 border bg-white">
              <p className="text-sm font-medium text-gray-500">Overall</p>
              <div className="mt-2">
                <StatusBadge status={data.overall} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Last checked {new Date(data.checkedAt).toLocaleTimeString()}
              </p>
            </div>
            <StatCard label="Active Jobs" value={totalActive} color="blue" />
            <StatCard label="Waiting Jobs" value={totalWaiting} color="yellow" />
            <StatCard label="Completed Jobs" value={totalCompleted} color="green" />
            <StatCard label="Failed Jobs" value={totalFailed} color={totalFailed > 0 ? 'red' : 'gray'} />
          </div>

          {/* Connectors */}
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            External Connectors
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {data.connectors.map((c) => (
              <ConnectorCard key={c.name} connector={c} />
            ))}
          </div>

          {/* Redis + Queues */}
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Workflow Queues (BullMQ / Redis)
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Redis — {data.redis.host}:{data.redis.port}
                </p>
                {data.redis.error && (
                  <p className="text-xs text-red-600 mt-1">{data.redis.error}</p>
                )}
              </div>
              <StatusBadge status={data.redis.status} />
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Queue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Waiting</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Delayed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Failed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.queues.map((q) => (
                  <tr key={q.name}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {q.name}
                      {q.error && (
                        <span className="ml-2 text-xs text-red-600">({q.error})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{q.active}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{q.waiting}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{q.delayed}</td>
                    <td className="px-4 py-3 text-sm text-green-700 text-right">{q.completed}</td>
                    <td
                      className={clsx(
                        'px-4 py-3 text-sm text-right font-medium',
                        q.failed > 0 ? 'text-red-600' : 'text-gray-700'
                      )}
                    >
                      {q.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
