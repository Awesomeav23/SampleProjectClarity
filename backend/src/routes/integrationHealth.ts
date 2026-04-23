import { Router } from 'express';
import type { Queue } from 'bullmq';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { services } from '../services/index.js';
import {
  sowApprovalQueue,
  changeOrderApprovalQueue,
  assignmentQueue,
  docusignQueue,
  timesheetSyncQueue,
} from '../services/workflowQueue.js';
import { config } from '../config.js';

const router = Router();
router.use(verifyJWT);

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

const QUEUES: { name: string; queue: Queue }[] = [
  { name: 'sow-approval', queue: sowApprovalQueue },
  { name: 'change-order-approval', queue: changeOrderApprovalQueue },
  { name: 'assignment-creation', queue: assignmentQueue },
  { name: 'docusign-status', queue: docusignQueue },
  { name: 'timesheet-sync', queue: timesheetSyncQueue },
];

async function ping<T>(fn: () => Promise<T>): Promise<{ latencyMs: number; result: T | null; error?: string }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { latencyMs: Date.now() - start, result };
  } catch (err) {
    return {
      latencyMs: Date.now() - start,
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function classify(latencyMs: number, error: string | undefined): ConnectorStatus {
  if (error) return 'down';
  if (latencyMs > 2000) return 'degraded';
  return 'healthy';
}

async function checkJobDiva(mode: 'mock' | 'live'): Promise<ConnectorHealth> {
  const { latencyMs, result, error } = await ping(() => services.jobdiva.getCustomers());
  return {
    name: 'JobDiva',
    status: classify(latencyMs, error),
    latencyMs,
    lastCheckedAt: new Date().toISOString(),
    mode,
    details: { customerCount: result?.length ?? 0 },
    error,
  };
}

async function checkDocuSign(mode: 'mock' | 'live'): Promise<ConnectorHealth> {
  const { latencyMs, result, error } = await ping(() => services.docusign.listEnvelopes());
  const envelopes = result ?? [];
  const byStatus = envelopes.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    name: 'DocuSign',
    status: classify(latencyMs, error),
    latencyMs,
    lastCheckedAt: new Date().toISOString(),
    mode,
    details: { envelopeCount: envelopes.length, byStatus },
    error,
  };
}

async function checkSharePoint(mode: 'mock' | 'live'): Promise<ConnectorHealth> {
  const { latencyMs, result, error } = await ping(() => services.sharepoint.listFolders());
  return {
    name: 'SharePoint',
    status: classify(latencyMs, error),
    latencyMs,
    lastCheckedAt: new Date().toISOString(),
    mode,
    details: { folderCount: result?.length ?? 0 },
    error,
  };
}

async function checkQueues(): Promise<{ redisStatus: ConnectorStatus; queues: QueueHealth[]; error?: string }> {
  const results: QueueHealth[] = [];
  let redisError: string | undefined;

  for (const { name, queue } of QUEUES) {
    try {
      const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
      results.push({
        name,
        active: counts.active ?? 0,
        waiting: counts.waiting ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      redisError = redisError ?? message;
      results.push({
        name,
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        error: message,
      });
    }
  }

  const totalFailed = results.reduce((n, q) => n + q.failed, 0);
  let redisStatus: ConnectorStatus = 'healthy';
  if (redisError) redisStatus = 'down';
  else if (totalFailed > 0) redisStatus = 'degraded';

  return { redisStatus, queues: results, error: redisError };
}

/**
 * GET /api/integration-health
 * Aggregated connector + queue health for the integration dashboard.
 */
router.get(
  '/',
  requirePermission('admin:system_config'),
  asyncHandler(async (_req, res) => {
    const mode: 'mock' | 'live' = config.mockMode ? 'mock' : 'live';

    const [jobdiva, docusign, sharepoint, queueReport] = await Promise.all([
      checkJobDiva(mode),
      checkDocuSign(mode),
      checkSharePoint(mode),
      checkQueues(),
    ]);

    const connectors = [jobdiva, docusign, sharepoint];
    const downCount = connectors.filter((c) => c.status === 'down').length;
    const degradedCount = connectors.filter((c) => c.status === 'degraded').length;

    let overall: ConnectorStatus = 'healthy';
    if (downCount > 0 || queueReport.redisStatus === 'down') overall = 'down';
    else if (degradedCount > 0 || queueReport.redisStatus === 'degraded') overall = 'degraded';

    res.json({
      overall,
      checkedAt: new Date().toISOString(),
      mode,
      connectors,
      redis: {
        status: queueReport.redisStatus,
        host: config.redis.host,
        port: config.redis.port,
        error: queueReport.error,
      },
      queues: queueReport.queues,
    });
  })
);

export default router;
