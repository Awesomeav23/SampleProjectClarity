/**
 * Validated Workflow Definitions
 *
 * These represent the stakeholder-approved workflows for Project Clarity.
 * Sign-off metadata tracks who approved, when, and any conditions.
 *
 * Stakeholder: Sharad (PM) — assignment workflow
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  order: number;
  action: string;
  actor: string;
  system: string;
  description: string;
  automated: boolean;
}

export interface WorkflowValidation {
  workflowId: string;
  name: string;
  approvedBy: string;
  approvedDate: string;
  version: number;
  status: 'approved' | 'pending_review' | 'rejected';
  notes: string;
  steps: WorkflowStep[];
}

// ─── Assignment Record Workflow (Pain Point 3.1) ───────────────────────────────
// Validated by: Sharad (PM)
// This replaces the manual email → back office → JobDiva process

export const ASSIGNMENT_WORKFLOW: WorkflowValidation = {
  workflowId: 'WF-ASSIGN-001',
  name: 'Assignment Record Creation',
  approvedBy: 'sharad@dynpro.com',
  approvedDate: '2026-04-10',
  version: 1,
  status: 'approved',
  notes: 'Replaces manual email to 8 back-office recipients. Sharad confirmed this matches his current process minus the manual steps.',
  steps: [
    {
      order: 1, action: 'Submit Assignment Request',
      actor: 'Project Manager', system: 'Project Clarity',
      description: 'PM fills out assignment form: resource, project, dates, allocation %, bill rate, approver',
      automated: false,
    },
    {
      order: 2, action: 'Validate Capacity',
      actor: 'System', system: 'Project Clarity',
      description: 'Check resource is not over-allocated (>100% across all projects). Warn if approaching threshold.',
      automated: true,
    },
    {
      order: 3, action: 'Validate Bill Rate',
      actor: 'System', system: 'Project Clarity',
      description: 'Compare submitted bill rate against role/location standard rate. Flag if deviation > 10%.',
      automated: true,
    },
    {
      order: 4, action: 'Create JobDiva Assignment Record',
      actor: 'System', system: 'JobDiva API',
      description: 'POST assignment record to JobDiva with resource, project, dates, allocation, bill rate.',
      automated: true,
    },
    {
      order: 5, action: 'Record Audit Trail',
      actor: 'System', system: 'Project Clarity DB',
      description: 'Store assignment details, JobDiva response, and timestamp in audit table.',
      automated: true,
    },
    {
      order: 6, action: 'Notify Stakeholders',
      actor: 'System', system: 'Email / Notification',
      description: 'Notify back-office recipients: Ash, Ankit, HR, Naveen, PM, BU Lead, PMO, Sales CS.',
      automated: true,
    },
    {
      order: 7, action: 'Enable Timesheet',
      actor: 'System', system: 'JobDiva',
      description: 'Assignment record in JobDiva triggers timesheet enablement for the resource on the project.',
      automated: true,
    },
  ],
};

// ─── SOW Creation Workflow ─────────────────────────────────────────────────────

export const SOW_CREATION_WORKFLOW: WorkflowValidation = {
  workflowId: 'WF-SOW-001',
  name: 'SOW Creation and Approval',
  approvedBy: 'sharath@dynpro.com',
  approvedDate: '2026-04-10',
  version: 1,
  status: 'approved',
  notes: 'Sharath validated template field sequences and section ordering. Conditional approval routing confirmed by Madhup.',
  steps: [
    {
      order: 1, action: 'Select Customer',
      actor: 'Finance Head', system: 'Project Clarity',
      description: 'Select customer from master. Auto-populate MSA, payment terms, holiday calendar.',
      automated: false,
    },
    {
      order: 2, action: 'Select SOW Template',
      actor: 'Finance Head', system: 'Project Clarity',
      description: 'Choose template type: Lean T&M, Elaborate T&M, or Fixed Fee.',
      automated: false,
    },
    {
      order: 3, action: 'Enter Scope',
      actor: 'Finance Head', system: 'Project Clarity',
      description: 'Fill in scope details. System auto-suggests from prior SOWs for same customer.',
      automated: false,
    },
    {
      order: 4, action: 'Build Resource Plan',
      actor: 'Finance Head', system: 'Project Clarity',
      description: 'Add roles, hours, rates. System auto-suggests rates from role/location standard rates.',
      automated: false,
    },
    {
      order: 5, action: 'Calculate Margin',
      actor: 'System', system: 'Project Clarity',
      description: 'Auto-calculate: Operating Margin = ((Total Revenue - Total Cost) / Total Revenue) x 100.',
      automated: true,
    },
    {
      order: 6, action: 'Margin Threshold Check',
      actor: 'System', system: 'Project Clarity',
      description: 'If margin < 40%, flag for escalated approval. Route to appropriate approvers.',
      automated: true,
    },
    {
      order: 7, action: 'Submit for Approval',
      actor: 'Finance Head', system: 'Project Clarity',
      description: 'Submit SOW. Routes to: >=40% → Finance Ops, 35-40% → BU Head + CRO, <35% → SLT chain.',
      automated: false,
    },
    {
      order: 8, action: 'Approve / Reject',
      actor: 'Approver(s)', system: 'Project Clarity',
      description: 'Approvers review and approve or reject with comments.',
      automated: false,
    },
    {
      order: 9, action: 'Generate SOW Document',
      actor: 'System', system: 'Project Clarity',
      description: 'Generate SOW document (PDF/Word) from template with all filled data and legal clauses.',
      automated: true,
    },
    {
      order: 10, action: 'Upload to SharePoint',
      actor: 'System', system: 'SharePoint',
      description: 'Upload generated SOW document to SharePoint with metadata tags.',
      automated: true,
    },
    {
      order: 11, action: 'Send for Signature',
      actor: 'System', system: 'DocuSign',
      description: 'Create DocuSign envelope with multi-signer routing (customer → DynPro leadership).',
      automated: true,
    },
    {
      order: 12, action: 'Capture Signature',
      actor: 'Customer + DynPro', system: 'DocuSign',
      description: 'Signers sign. Webhook captures signed date and effective date.',
      automated: false,
    },
    {
      order: 13, action: 'Activate SOW',
      actor: 'System', system: 'Project Clarity',
      description: 'Lock baseline resource plan. Create execution plan. Trigger assignment records for named resources.',
      automated: true,
    },
  ],
};

// ─── Change Order Workflow ─────────────────────────────────────────────────────

export const CHANGE_ORDER_WORKFLOW: WorkflowValidation = {
  workflowId: 'WF-CO-001',
  name: 'Change Order Processing',
  approvedBy: 'sharad@dynpro.com',
  approvedDate: '2026-04-10',
  version: 1,
  status: 'approved',
  notes: 'Confirmed by Sharad. Financial impact calculation validated by Madhup using SurveyMonkey CO-001 as reference.',
  steps: [
    {
      order: 1, action: 'Initiate Change Request',
      actor: 'Project Manager', system: 'Project Clarity',
      description: 'Classify change type: timeline, resource, or scope. Describe the change.',
      automated: false,
    },
    {
      order: 2, action: 'Calculate Financial Impact',
      actor: 'System', system: 'Project Clarity',
      description: 'Auto-calculate: Additions (new hours x rates) - Credits (removed hours x rates) = Net Impact.',
      automated: true,
    },
    {
      order: 3, action: 'Review Updated Margin',
      actor: 'System', system: 'Project Clarity',
      description: 'Recalculate operating margin with change order impact. Flag if drops below threshold.',
      automated: true,
    },
    {
      order: 4, action: 'Route for Approval',
      actor: 'System', system: 'Project Clarity',
      description: 'Route based on financial magnitude. Standard threshold applies.',
      automated: true,
    },
    {
      order: 5, action: 'Approve / Reject',
      actor: 'Approver(s)', system: 'Project Clarity',
      description: 'Approvers review financial impact and approve or reject.',
      automated: false,
    },
    {
      order: 6, action: 'Update SOW Value',
      actor: 'System', system: 'Project Clarity',
      description: 'Updated SOW total = Original Value + Net Impact. Update execution resource plan.',
      automated: true,
    },
    {
      order: 7, action: 'Generate Change Order Document',
      actor: 'System', system: 'Project Clarity + SharePoint',
      description: 'Generate CO document and upload to SharePoint. Link to parent SOW.',
      automated: true,
    },
  ],
};

// ─── Lookup ────────────────────────────────────────────────────────────────────

export const ALL_WORKFLOWS: WorkflowValidation[] = [
  ASSIGNMENT_WORKFLOW,
  SOW_CREATION_WORKFLOW,
  CHANGE_ORDER_WORKFLOW,
];

export function getWorkflow(workflowId: string): WorkflowValidation | undefined {
  return ALL_WORKFLOWS.find((w) => w.workflowId === workflowId);
}
