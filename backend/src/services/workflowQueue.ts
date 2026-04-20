/**
 * BullMQ Workflow Queue
 *
 * Handles async workflow orchestration backed by Redis:
 *   - SOW approval routing (standard, escalated, SLT)
 *   - Change order approval routing
 *   - Assignment record creation (JobDiva API call + notifications)
 *   - DocuSign envelope status polling
 *   - Timesheet sync scheduling
 *
 * Replaces Temporal.io with a simpler, cheaper alternative.
 * BullMQ runs on the same Redis instance used for caching.
 */

import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config.js';

// ─── Connection ────────────────────────────────────────────────────────────────

const connection = {
  host: config.redis.host,
  port: config.redis.port,
};

// ─── Queue Definitions ─────────────────────────────────────────────────────────

export const sowApprovalQueue = new Queue('sow-approval', { connection });
export const changeOrderApprovalQueue = new Queue('change-order-approval', { connection });
export const assignmentQueue = new Queue('assignment-creation', { connection });
export const docusignQueue = new Queue('docusign-status', { connection });
export const timesheetSyncQueue = new Queue('timesheet-sync', { connection });

// ─── Job Data Types ────────────────────────────────────────────────────────────

export interface SOWApprovalJobData {
  sowId: string;
  operatingMarginPercent: number;
  approvers: string[];
  currentApproverIndex: number;
  submittedBy: string;
}

export interface ChangeOrderApprovalJobData {
  changeOrderId: string;
  sowId: string;
  netImpact: number;
  approvers: string[];
  currentApproverIndex: number;
  submittedBy: string;
}

export interface AssignmentJobData {
  resourceId: string;
  projectId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
  billRate: number;
  approverEmail: string;
  submittedBy: string;
}

export interface DocuSignStatusJobData {
  envelopeId: string;
  sowId: string;
  checkCount: number;
  maxChecks: number;
}

export interface TimesheetSyncJobData {
  syncType: 'incremental' | 'full';
  projectIds?: string[];
}

// ─── Queue Helper Functions ────────────────────────────────────────────────────

export async function submitSOWForApproval(data: SOWApprovalJobData): Promise<Job> {
  return sowApprovalQueue.add('approve-sow', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function submitChangeOrderForApproval(data: ChangeOrderApprovalJobData): Promise<Job> {
  return changeOrderApprovalQueue.add('approve-change-order', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function queueAssignmentCreation(data: AssignmentJobData): Promise<Job> {
  return assignmentQueue.add('create-assignment', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export async function queueDocuSignStatusCheck(data: DocuSignStatusJobData): Promise<Job> {
  return docusignQueue.add('check-status', data, {
    delay: 60_000, // check after 1 minute
    attempts: 1,
  });
}

export async function scheduleTimesheetSync(data: TimesheetSyncJobData): Promise<Job> {
  return timesheetSyncQueue.add('sync-timesheets', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
  });
}

// ─── Recurring Jobs ────────────────────────────────────────────────────────────

export async function setupRecurringJobs(): Promise<void> {
  // Hourly timesheet sync from JobDiva
  await timesheetSyncQueue.upsertJobScheduler(
    'hourly-timesheet-sync',
    { pattern: '0 * * * *' }, // every hour
    { name: 'sync-timesheets', data: { syncType: 'incremental' as const } },
  );

  // Nightly full data refresh
  await timesheetSyncQueue.upsertJobScheduler(
    'nightly-full-sync',
    { pattern: '0 2 * * *' }, // 2 AM daily
    { name: 'sync-timesheets', data: { syncType: 'full' as const } },
  );

  console.log('[BULLMQ] Recurring jobs scheduled: hourly timesheet sync, nightly full sync');
}

// ─── Worker Factory (called when server starts) ───────────────────────────────

export function createWorkers(): Worker[] {
  const sowWorker = new Worker('sow-approval', async (job: Job<SOWApprovalJobData>) => {
    console.log(`[WORKER] Processing SOW approval: ${job.data.sowId}`);
    console.log(`[WORKER] Margin: ${job.data.operatingMarginPercent}%, Approver ${job.data.currentApproverIndex + 1}/${job.data.approvers.length}: ${job.data.approvers[job.data.currentApproverIndex]}`);
    // In real implementation: send notification to approver, update SOW status
  }, { connection });

  const coWorker = new Worker('change-order-approval', async (job: Job<ChangeOrderApprovalJobData>) => {
    console.log(`[WORKER] Processing change order approval: ${job.data.changeOrderId}`);
    console.log(`[WORKER] Net impact: $${job.data.netImpact}, Approver: ${job.data.approvers[job.data.currentApproverIndex]}`);
  }, { connection });

  const assignWorker = new Worker('assignment-creation', async (job: Job<AssignmentJobData>) => {
    console.log(`[WORKER] Creating assignment: ${job.data.resourceId} → ${job.data.projectId}`);
    // In real implementation: call services.jobdiva.createJobDivaAssignment()
  }, { connection });

  const dsWorker = new Worker('docusign-status', async (job: Job<DocuSignStatusJobData>) => {
    console.log(`[WORKER] Checking DocuSign status: ${job.data.envelopeId} (check ${job.data.checkCount}/${job.data.maxChecks})`);
    // In real implementation: call services.docusign.getEnvelopeStatus()
    // If not completed and under maxChecks, re-queue with incremented checkCount
  }, { connection });

  const tsWorker = new Worker('timesheet-sync', async (job: Job<TimesheetSyncJobData>) => {
    console.log(`[WORKER] Timesheet sync: ${job.data.syncType}`);
    // In real implementation: call services.jobdiva.getTimesheets() and update local DB
  }, { connection });

  console.log('[BULLMQ] Workers started: sow-approval, change-order-approval, assignment-creation, docusign-status, timesheet-sync');

  return [sowWorker, coWorker, assignWorker, dsWorker, tsWorker];
}
