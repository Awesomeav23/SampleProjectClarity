/**
 * SOW Engine — Core business logic for SOW creation and management.
 *
 * Handles:
 *   - Auto-populating fields from customer/MSA
 *   - Margin calculation using financeRules.ts formulas
 *   - Approval routing based on margin thresholds
 *   - SOW lifecycle management (draft → pending_approval → approved → signed → active)
 */

import { db } from '../lib/db.js';
import { MARGIN_FORMULAS, getApprovalLevel } from './financeRules.js';
import { getAutoInjectClauses } from './legalApprovals.js';
import { getTemplateById } from './sowTemplates.js';
import { submitSOWForApproval } from './workflowQueue.js';
import { nanoid } from 'nanoid';

// ─── Auto-populate from Customer / MSA ─────────────────────────────────────────

export interface AutoPopulatedData {
  customerId: string;
  customerName: string;
  msaId: string | null;
  paymentTerms: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  holidayCalendar: string | null;
}

export async function autoPopulateFromCustomer(customerId: string): Promise<AutoPopulatedData> {
  const customer = await db('customers').where('id', customerId).first();
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const msa = await db('msas')
    .where('customer_id', customerId)
    .andWhere('status', 'active')
    .first();

  return {
    customerId: customer.id,
    customerName: customer.name,
    msaId: msa?.id ?? null,
    paymentTerms: msa?.payment_terms ?? customer.payment_terms,
    primaryContactName: customer.primary_contact_name,
    primaryContactEmail: customer.primary_contact_email,
    holidayCalendar: customerId, // used to look up customer-specific holidays
  };
}

// ─── Margin Calculation ────────────────────────────────────────────────────────

export interface ResourceLine {
  roleId: string;
  locationId: string;
  resourceId?: string;
  hours: number;
  billRate: number;
}

export interface MarginResult {
  totalRevenue: number;
  totalCost: number;
  marginPercent: number;
  approvalLevel: string;
  approvers: string[];
  approvalDescription: string;
  perResource: {
    roleId: string;
    locationId: string;
    hours: number;
    billRate: number;
    flcRate: number;
    revenue: number;
    cost: number;
    marginPercent: number;
  }[];
}

export async function calculateMargin(resourceLines: ResourceLine[]): Promise<MarginResult> {
  // Look up FLC rates for each line from role_rates table
  const linesWithFlc = await Promise.all(
    resourceLines.map(async (line) => {
      // Try to get FLC from specific resource first, then fall back to role rate
      let flcRate: number;

      if (line.resourceId) {
        const resource = await db('resources').where('id', line.resourceId).first();
        flcRate = resource ? parseFloat(resource.flc_per_hour) : 0;
      } else {
        const roleRate = await db('role_rates')
          .where('role_id', line.roleId)
          .andWhere('location_id', line.locationId)
          .orderBy('effective_date', 'desc')
          .first();
        flcRate = roleRate ? parseFloat(roleRate.flc) : 0;
      }

      return { ...line, flcRate };
    })
  );

  // Calculate margin using financeRules formulas
  const marginCalc = MARGIN_FORMULAS.sowMargin(
    linesWithFlc.map((l) => ({
      hours: l.hours,
      billRate: l.billRate,
      flcRate: l.flcRate,
    }))
  );

  // Determine approval level
  const approvalThreshold = getApprovalLevel(marginCalc.marginPercent);

  return {
    totalRevenue: marginCalc.totalRevenue,
    totalCost: marginCalc.totalCost,
    marginPercent: marginCalc.marginPercent,
    approvalLevel: approvalThreshold.approvalLevel,
    approvers: approvalThreshold.approvers,
    approvalDescription: approvalThreshold.description,
    perResource: linesWithFlc.map((l) => ({
      roleId: l.roleId,
      locationId: l.locationId,
      hours: l.hours,
      billRate: l.billRate,
      flcRate: l.flcRate,
      revenue: Math.round(l.hours * l.billRate * 100) / 100,
      cost: Math.round(l.hours * l.flcRate * 100) / 100,
      marginPercent:
        l.hours * l.billRate > 0
          ? Math.round(MARGIN_FORMULAS.resourceLineMargin(l.hours, l.billRate, l.flcRate) * 10) / 10
          : 0,
    })),
  };
}

// ─── Create SOW Draft ──────────────────────────────────────────────────────────

export interface CreateSOWInput {
  templateId: string;
  customerId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdBy: string;
}

export async function createSOWDraft(input: CreateSOWInput) {
  const template = getTemplateById(input.templateId);
  if (!template) throw new Error(`Template ${input.templateId} not found`);

  const autoData = await autoPopulateFromCustomer(input.customerId);
  if (!autoData.msaId) throw new Error(`No active MSA found for customer ${input.customerId}`);

  const sowId = `SOW-${nanoid(6).toUpperCase()}`;

  await db('sows').insert({
    id: sowId,
    customer_id: input.customerId,
    msa_id: autoData.msaId,
    template_id: input.templateId,
    title: input.title,
    type: template.type,
    status: 'draft',
    start_date: input.startDate,
    end_date: input.endDate,
    created_by: input.createdBy,
    form_data: JSON.stringify({
      customerName: autoData.customerName,
      paymentTerms: autoData.paymentTerms,
      primaryContactName: autoData.primaryContactName,
      primaryContactEmail: autoData.primaryContactEmail,
      holidayCalendar: autoData.holidayCalendar,
    }),
  });

  const sow = await db('sows').where('id', sowId).first();
  return { ...sow, autoPopulated: autoData };
}

// ─── Submit for Approval ───────────────────────────────────────────────────────

export async function submitForApproval(
  sowId: string,
  resourceLines: ResourceLine[],
  submittedBy: string
) {
  const sow = await db('sows').where('id', sowId).first();
  if (!sow) throw new Error(`SOW ${sowId} not found`);
  if (sow.status !== 'draft') throw new Error(`SOW ${sowId} is not in draft status`);

  // Calculate margin
  const margin = await calculateMargin(resourceLines);

  // Save resource lines
  await db('sow_resource_lines').where('sow_id', sowId).del();
  for (const line of margin.perResource) {
    await db('sow_resource_lines').insert({
      sow_id: sowId,
      role_id: line.roleId,
      location_id: line.locationId,
      hours: line.hours,
      bill_rate: line.billRate,
      flc_rate: line.flcRate,
      line_revenue: line.revenue,
      line_cost: line.cost,
    });
  }

  // Update SOW
  await db('sows').where('id', sowId).update({
    status: 'pending_approval',
    total_value: margin.totalRevenue,
    operating_margin_percent: margin.marginPercent,
    updated_at: new Date().toISOString(),
  });

  // Queue approval job
  await submitSOWForApproval({
    sowId,
    operatingMarginPercent: margin.marginPercent,
    approvers: margin.approvers,
    currentApproverIndex: 0,
    submittedBy,
  });

  // Log to audit
  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sowId,
    action: 'submit',
    actor_id: submittedBy,
    actor_email: submittedBy,
    changes: JSON.stringify({ status: 'pending_approval', marginPercent: margin.marginPercent }),
  });

  return { sowId, status: 'pending_approval', margin };
}

// ─── Approve / Reject ──────────────────────────────────────────────────────────

export async function approveSOW(sowId: string, approvedBy: string, comments?: string) {
  const sow = await db('sows').where('id', sowId).first();
  if (!sow) throw new Error(`SOW ${sowId} not found`);
  if (sow.status !== 'pending_approval') throw new Error(`SOW ${sowId} is not pending approval`);

  await db('sows').where('id', sowId).update({
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sowId,
    action: 'approve',
    actor_id: approvedBy,
    actor_email: approvedBy,
    changes: JSON.stringify({ status: 'approved', comments }),
  });

  return { sowId, status: 'approved', approvedBy };
}

export async function rejectSOW(sowId: string, rejectedBy: string, comments: string) {
  const sow = await db('sows').where('id', sowId).first();
  if (!sow) throw new Error(`SOW ${sowId} not found`);
  if (sow.status !== 'pending_approval') throw new Error(`SOW ${sowId} is not pending approval`);

  await db('sows').where('id', sowId).update({
    status: 'draft', // goes back to draft for revision
    updated_at: new Date().toISOString(),
  });

  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sowId,
    action: 'reject',
    actor_id: rejectedBy,
    actor_email: rejectedBy,
    changes: JSON.stringify({ status: 'draft', comments }),
  });

  return { sowId, status: 'draft', rejectedBy, comments };
}
