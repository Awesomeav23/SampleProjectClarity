/**
 * JobDiva Mock Client
 *
 * Simulates the JobDiva REST API for all integration points defined in the
 * Project Clarity business case. Swap this file with a real implementation
 * when credentials are available — the interfaces stay the same.
 *
 * Integration points:
 *   Inbound  → customers, employees, opportunities, timesheets, MSAs
 *   Outbound → assignment records, resource allocation updates
 */

import { nanoid } from 'nanoid';
import {
  CUSTOMERS,
  MSAS,
  OPPORTUNITIES,
  RESOURCES,
  RESOURCE_ALLOCATIONS,
  TIMESHEET_ENTRIES,
  type Customer,
  type MSA,
  type Opportunity,
  type Resource,
  type ResourceAllocation,
  type TimesheetEntry,
} from './mockData.js';

// ─── Assignment Creation (existing) ────────────────────────────────────────────

export interface JobDivaAssignmentInput {
  resourceId: string;
  projectId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
  billRate: number;
  approverEmail: string;
}

export interface JobDivaResponse {
  success: boolean;
  assignmentId?: string;
  error?: string;
}

export async function createJobDivaAssignment(
  input: JobDivaAssignmentInput
): Promise<JobDivaResponse> {
  await simulateLatency();

  if (input.allocationPercent > 100) {
    return { success: false, error: 'Allocation percent exceeds 100%' };
  }

  return { success: true, assignmentId: `JD-${nanoid(8).toUpperCase()}` };
}

// ─── Customer Master ───────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  await simulateLatency();
  return [...CUSTOMERS];
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  await simulateLatency();
  return CUSTOMERS.find((c) => c.id === customerId) ?? null;
}

// ─── Employee / Resource Master ────────────────────────────────────────────────

export async function getEmployees(): Promise<Resource[]> {
  await simulateLatency();
  return [...RESOURCES];
}

export async function getEmployeeById(resourceId: string): Promise<Resource | null> {
  await simulateLatency();
  return RESOURCES.find((r) => r.id === resourceId) ?? null;
}

export async function getEmployeesByLocation(locationId: string): Promise<Resource[]> {
  await simulateLatency();
  return RESOURCES.filter((r) => r.locationId === locationId);
}

// ─── Opportunity / Pipeline ────────────────────────────────────────────────────

export async function getOpportunities(): Promise<Opportunity[]> {
  await simulateLatency();
  return [...OPPORTUNITIES];
}

export async function getOpportunitiesByCustomer(customerId: string): Promise<Opportunity[]> {
  await simulateLatency();
  return OPPORTUNITIES.filter((o) => o.customerId === customerId);
}

// ─── MSA Repository ────────────────────────────────────────────────────────────

export async function getMSAs(): Promise<MSA[]> {
  await simulateLatency();
  return [...MSAS];
}

export async function getMSAByCustomer(customerId: string): Promise<MSA | null> {
  await simulateLatency();
  return MSAS.find((m) => m.customerId === customerId) ?? null;
}

export async function getMSAById(msaId: string): Promise<MSA | null> {
  await simulateLatency();
  return MSAS.find((m) => m.id === msaId) ?? null;
}

// ─── Timesheet Data Feed ───────────────────────────────────────────────────────

export async function getTimesheets(filters?: {
  resourceId?: string;
  projectId?: string;
  weekStartDate?: string;
}): Promise<TimesheetEntry[]> {
  await simulateLatency();
  let results = [...TIMESHEET_ENTRIES];

  if (filters?.resourceId) {
    results = results.filter((t) => t.resourceId === filters.resourceId);
  }
  if (filters?.projectId) {
    results = results.filter((t) => t.projectId === filters.projectId);
  }
  if (filters?.weekStartDate) {
    results = results.filter((t) => t.weekStartDate === filters.weekStartDate);
  }

  return results;
}

export async function getTimesheetsByWeek(weekStartDate: string): Promise<TimesheetEntry[]> {
  await simulateLatency();
  return TIMESHEET_ENTRIES.filter((t) => t.weekStartDate === weekStartDate);
}

// ─── Resource Allocations ──────────────────────────────────────────────────────

export async function getResourceAllocations(filters?: {
  resourceId?: string;
  projectId?: string;
}): Promise<ResourceAllocation[]> {
  await simulateLatency();
  let results = [...RESOURCE_ALLOCATIONS];

  if (filters?.resourceId) {
    results = results.filter((a) => a.resourceId === filters.resourceId);
  }
  if (filters?.projectId) {
    results = results.filter((a) => a.projectId === filters.projectId);
  }

  return results;
}

export async function updateResourceAllocation(
  allocationId: string,
  updates: Partial<Pick<ResourceAllocation, 'allocationPercent' | 'endDate' | 'billRate'>>
): Promise<JobDivaResponse> {
  await simulateLatency();

  const allocation = RESOURCE_ALLOCATIONS.find((a) => a.id === allocationId);
  if (!allocation) {
    return { success: false, error: `Allocation ${allocationId} not found` };
  }

  // In mock mode, we just log the update
  console.log(`[JOBDIVA MOCK] Updated allocation ${allocationId}:`, updates);
  return { success: true, assignmentId: allocationId };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function simulateLatency(): Promise<void> {
  const ms = 100 + Math.random() * 200; // 100-300ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}
