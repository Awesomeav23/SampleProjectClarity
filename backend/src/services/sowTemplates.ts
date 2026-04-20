/**
 * SOW Template Structures
 *
 * Defines the field sequences, sections, and content blocks for each SOW type.
 * These templates drive the SOW Creation Engine's guided questionnaire workflow.
 *
 * Template types (from the business case):
 *   - Lean T&M: lightweight time & material — fewer sections, faster turnaround
 *   - Elaborate T&M: full time & material — detailed scope, resource plan, acceptance criteria
 *   - Fixed Fee: milestone/deliverable-based — payment schedule tied to deliverables
 *
 * Template sources:
 *   - Generic: default template per type
 *   - Customer-specific: overrides for specific customers (e.g., extra compliance sections)
 *   - Prior SOW reuse: clone from a previous SOW and modify
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SOWTemplateType = 'lean_tm' | 'elaborate_tm' | 'fixed_fee';

export interface SOWTemplate {
  id: string;
  type: SOWTemplateType;
  name: string;
  description: string;
  version: number;
  sections: SOWSection[];
  requiredFields: string[]; // field IDs that must be filled before submission
  approvalRules: ApprovalRule[];
}

export interface SOWSection {
  id: string;
  title: string;
  order: number;
  required: boolean;
  description: string;
  fields: SOWField[];
  legalClauseIds?: string[]; // MSA clause IDs auto-injected into this section
  conditionalOn?: string;    // field ID — section only shown if that field has a value
}

export interface SOWField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'multiselect' | 'resource_plan' | 'milestone_table' | 'auto_calculated';
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];      // for select/multiselect
  defaultValue?: string | number;
  autoPopulateFrom?: string;     // data source: 'customer', 'msa', 'opportunity', 'role_rates'
  validation?: FieldValidation;
  helpText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  customRule?: string; // e.g., 'margin_threshold_check'
}

export interface ApprovalRule {
  condition: string;           // e.g., 'operating_margin < 40'
  approvers: string[];         // stakeholder emails in order
  description: string;
}

// ─── Shared Field Definitions ──────────────────────────────────────────────────

const CUSTOMER_FIELDS: SOWField[] = [
  {
    id: 'customer_id', label: 'Customer', type: 'select', required: true,
    autoPopulateFrom: 'customer',
    helpText: 'Selecting a customer auto-populates MSA, payment terms, and holiday calendar',
    options: [], // populated at runtime from customer master
  },
  {
    id: 'customer_contact_name', label: 'Customer Contact Name', type: 'text', required: true,
    autoPopulateFrom: 'customer',
  },
  {
    id: 'customer_contact_email', label: 'Customer Contact Email', type: 'text', required: true,
    autoPopulateFrom: 'customer',
    validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  },
  {
    id: 'msa_id', label: 'Master Service Agreement', type: 'select', required: true,
    autoPopulateFrom: 'msa',
    helpText: 'Auto-populated when customer is selected. Legal clauses injected from MSA.',
    options: [],
  },
];

const PROJECT_FIELDS: SOWField[] = [
  { id: 'sow_title', label: 'SOW Title', type: 'text', required: true, placeholder: 'e.g., Workato Integration Services' },
  { id: 'project_description', label: 'Project Description', type: 'textarea', required: true, placeholder: 'High-level description of the engagement...' },
  { id: 'start_date', label: 'Start Date', type: 'date', required: true },
  { id: 'end_date', label: 'End Date', type: 'date', required: true },
  {
    id: 'billing_model', label: 'Billing Model', type: 'select', required: true,
    options: [
      { value: 'lean_tm', label: 'Lean Time & Material' },
      { value: 'elaborate_tm', label: 'Elaborate Time & Material' },
      { value: 'fixed_fee', label: 'Fixed Fee' },
    ],
  },
  {
    id: 'payment_terms', label: 'Payment Terms', type: 'select', required: true,
    autoPopulateFrom: 'msa',
    options: [
      { value: 'net_30', label: 'Net 30' },
      { value: 'net_45', label: 'Net 45' },
      { value: 'net_60', label: 'Net 60' },
    ],
  },
];

const SCOPE_FIELDS: SOWField[] = [
  { id: 'scope_overview', label: 'Scope Overview', type: 'textarea', required: true, placeholder: 'Describe the scope of work...' },
  { id: 'in_scope_items', label: 'In-Scope Deliverables', type: 'textarea', required: true, placeholder: 'List all deliverables included...' },
  { id: 'out_of_scope_items', label: 'Out-of-Scope Items', type: 'textarea', required: true, placeholder: 'Explicitly list what is NOT included...' },
  { id: 'assumptions', label: 'Assumptions', type: 'textarea', required: true, placeholder: 'List key assumptions...' },
  { id: 'dependencies', label: 'Dependencies', type: 'textarea', required: false, placeholder: 'External dependencies or prerequisites...' },
];

const RESOURCE_PLAN_FIELDS: SOWField[] = [
  {
    id: 'resource_plan', label: 'Resource Plan', type: 'resource_plan', required: true,
    helpText: 'Add roles with hours, rates, and allocation. Rates auto-suggested from role/location standard rates.',
  },
  {
    id: 'total_hours', label: 'Total Estimated Hours', type: 'auto_calculated', required: false,
    helpText: 'Auto-calculated from resource plan',
  },
  {
    id: 'total_value', label: 'Total SOW Value', type: 'auto_calculated', required: false,
    helpText: 'Auto-calculated: SUM(hours x bill rate) for each resource',
  },
  {
    id: 'total_cost', label: 'Total Estimated Cost', type: 'auto_calculated', required: false,
    helpText: 'Auto-calculated: SUM(hours x FLC) for each resource',
  },
  {
    id: 'operating_margin', label: 'Operating Margin %', type: 'auto_calculated', required: false,
    helpText: 'Auto-calculated: ((Total Value - Total Cost) / Total Value) x 100. Alert if < 40%.',
    validation: { customRule: 'margin_threshold_check' },
  },
];

const MILESTONE_FIELDS: SOWField[] = [
  {
    id: 'milestone_table', label: 'Milestones & Deliverables', type: 'milestone_table', required: true,
    helpText: 'Define milestones with deliverables, due dates, acceptance criteria, and payment amounts',
  },
  {
    id: 'total_milestone_value', label: 'Total Milestone Value', type: 'auto_calculated', required: false,
    helpText: 'Must equal Total SOW Value',
  },
];

const ACCEPTANCE_FIELDS: SOWField[] = [
  {
    id: 'acceptance_criteria', label: 'Acceptance Criteria', type: 'textarea', required: true,
    placeholder: 'Define how deliverables will be accepted or rejected...',
  },
  {
    id: 'acceptance_period', label: 'Acceptance Period (business days)', type: 'number', required: true,
    defaultValue: 5, validation: { min: 1, max: 30 },
  },
  {
    id: 'warranty_period', label: 'Warranty/Defect Fix Period (days)', type: 'number', required: false,
    defaultValue: 30, validation: { min: 0, max: 90 },
  },
];

const GOVERNANCE_FIELDS: SOWField[] = [
  {
    id: 'dynpro_pm', label: 'DynPro Project Manager', type: 'select', required: true,
    autoPopulateFrom: 'resource', options: [],
  },
  {
    id: 'customer_pm', label: 'Customer Project Manager', type: 'text', required: true,
  },
  {
    id: 'escalation_path', label: 'Escalation Path', type: 'textarea', required: false,
    placeholder: 'Level 1: PM → Level 2: BU Lead → Level 3: Executive',
    defaultValue: 'Level 1: Project Manager\nLevel 2: BU Head\nLevel 3: CRO / Executive Leadership',
  },
  {
    id: 'status_reporting', label: 'Status Reporting Frequency', type: 'select', required: true,
    options: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'biweekly', label: 'Bi-Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ],
    defaultValue: 'weekly',
  },
  {
    id: 'communication_tools', label: 'Communication Tools', type: 'multiselect', required: false,
    options: [
      { value: 'email', label: 'Email' },
      { value: 'slack', label: 'Slack' },
      { value: 'teams', label: 'Microsoft Teams' },
      { value: 'jira', label: 'Jira' },
    ],
  },
];

const HOLIDAY_FIELDS: SOWField[] = [
  {
    id: 'holiday_calendar', label: 'Holiday Calendar', type: 'select', required: true,
    autoPopulateFrom: 'customer',
    helpText: 'Customer-specific holiday calendar. Affects working day calculations for T&M billing.',
    options: [
      { value: 'us_standard', label: 'US Standard' },
      { value: 'india_pune', label: 'India - Pune' },
      { value: 'india_mohali', label: 'India - Mohali' },
      { value: 'customer_specific', label: 'Customer-Specific' },
    ],
  },
  {
    id: 'work_location', label: 'Primary Work Location', type: 'select', required: true,
    options: [
      { value: 'onshore', label: 'Onshore (US)' },
      { value: 'offshore_pune', label: 'Offshore (Pune)' },
      { value: 'offshore_mohali', label: 'Offshore (Mohali)' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  },
];

// ─── Standard Approval Rules ───────────────────────────────────────────────────

const STANDARD_APPROVAL_RULES: ApprovalRule[] = [
  {
    condition: 'operating_margin >= 40',
    approvers: ['madhup@dynpro.com'],
    description: 'Standard approval — margin at or above 40%',
  },
  {
    condition: 'operating_margin >= 35 && operating_margin < 40',
    approvers: ['bu-head@dynpro.com', 'cro@dynpro.com'],
    description: 'Escalated approval — margin between 35-40% requires BU Head and CRO',
  },
  {
    condition: 'operating_margin < 35',
    approvers: ['bu-head@dynpro.com', 'cro@dynpro.com', 'shiv@dynpro.com'],
    description: 'SLT approval — margin below 35% requires full leadership chain',
  },
];

// ─── Template Definitions ──────────────────────────────────────────────────────

export const SOW_TEMPLATES: SOWTemplate[] = [
  // ── Lean T&M ─────────────────────────────────────────────────────────────
  {
    id: 'TPL-LEAN-TM',
    type: 'lean_tm',
    name: 'Lean Time & Material',
    description: 'Lightweight T&M template for straightforward engagements. Fewer sections, faster turnaround. Best for staff augmentation or well-defined ongoing support.',
    version: 4,
    requiredFields: [
      'customer_id', 'msa_id', 'sow_title', 'start_date', 'end_date',
      'billing_model', 'payment_terms', 'scope_overview', 'in_scope_items',
      'out_of_scope_items', 'assumptions', 'resource_plan', 'holiday_calendar',
      'work_location', 'dynpro_pm',
    ],
    approvalRules: STANDARD_APPROVAL_RULES,
    sections: [
      {
        id: 'sec_customer', title: '1. Customer Information', order: 1, required: true,
        description: 'Customer details and MSA linkage',
        fields: CUSTOMER_FIELDS,
      },
      {
        id: 'sec_project', title: '2. Engagement Overview', order: 2, required: true,
        description: 'Project title, dates, and billing model',
        fields: PROJECT_FIELDS,
      },
      {
        id: 'sec_scope', title: '3. Scope of Work', order: 3, required: true,
        description: 'What is included and excluded',
        fields: [SCOPE_FIELDS[0], SCOPE_FIELDS[1], SCOPE_FIELDS[2], SCOPE_FIELDS[3]],
      },
      {
        id: 'sec_resources', title: '4. Resource Plan & Pricing', order: 4, required: true,
        description: 'Roles, hours, rates, and margin calculation',
        fields: [...RESOURCE_PLAN_FIELDS, ...HOLIDAY_FIELDS],
      },
      {
        id: 'sec_governance', title: '5. Governance', order: 5, required: true,
        description: 'Project management and communication',
        fields: [GOVERNANCE_FIELDS[0], GOVERNANCE_FIELDS[1], GOVERNANCE_FIELDS[3]],
      },
      {
        id: 'sec_legal', title: '6. Terms & Conditions', order: 6, required: true,
        description: 'Auto-injected from MSA. Change Request process included by default.',
        fields: [],
        legalClauseIds: ['CL-001', 'CL-002', 'CL-003', 'CL-005'],
      },
    ],
  },

  // ── Elaborate T&M ────────────────────────────────────────────────────────
  {
    id: 'TPL-ELAB-TM',
    type: 'elaborate_tm',
    name: 'Elaborate Time & Material',
    description: 'Comprehensive T&M template for complex, multi-phase engagements. Full scope definition, detailed resource plan, acceptance criteria, and governance structure.',
    version: 3,
    requiredFields: [
      'customer_id', 'msa_id', 'sow_title', 'project_description', 'start_date', 'end_date',
      'billing_model', 'payment_terms', 'scope_overview', 'in_scope_items',
      'out_of_scope_items', 'assumptions', 'resource_plan', 'acceptance_criteria',
      'acceptance_period', 'holiday_calendar', 'work_location', 'dynpro_pm', 'customer_pm',
    ],
    approvalRules: STANDARD_APPROVAL_RULES,
    sections: [
      {
        id: 'sec_customer', title: '1. Customer Information', order: 1, required: true,
        description: 'Customer details, MSA linkage, and key contacts',
        fields: CUSTOMER_FIELDS,
      },
      {
        id: 'sec_project', title: '2. Engagement Overview', order: 2, required: true,
        description: 'Project title, description, dates, and billing model',
        fields: PROJECT_FIELDS,
      },
      {
        id: 'sec_scope', title: '3. Scope of Work', order: 3, required: true,
        description: 'Detailed scope with deliverables, exclusions, assumptions, and dependencies',
        fields: SCOPE_FIELDS,
      },
      {
        id: 'sec_resources', title: '4. Resource Plan & Pricing', order: 4, required: true,
        description: 'Detailed roles, hours, rates, location, and real-time margin calculation',
        fields: [...RESOURCE_PLAN_FIELDS, ...HOLIDAY_FIELDS],
      },
      {
        id: 'sec_acceptance', title: '5. Acceptance Criteria', order: 5, required: true,
        description: 'How deliverables are reviewed, accepted, and warranted',
        fields: ACCEPTANCE_FIELDS,
      },
      {
        id: 'sec_governance', title: '6. Project Governance', order: 6, required: true,
        description: 'Full governance: PM assignments, escalation, reporting, communication',
        fields: GOVERNANCE_FIELDS,
      },
      {
        id: 'sec_change_mgmt', title: '7. Change Management', order: 7, required: true,
        description: 'Change order process — auto-injected from MSA clause',
        fields: [
          {
            id: 'change_request_process', label: 'Change Request Process', type: 'textarea', required: false,
            helpText: 'Auto-populated from MSA. Editable if customer requires modifications.',
            defaultValue: 'Changes to this SOW must be documented in a written Change Order signed by authorized representatives of both parties. No work shall commence on changes until a Change Order is fully executed.',
          },
        ],
        legalClauseIds: ['CL-005'],
      },
      {
        id: 'sec_legal', title: '8. Terms & Conditions', order: 8, required: true,
        description: 'Full legal terms auto-injected from MSA',
        fields: [],
        legalClauseIds: ['CL-001', 'CL-002', 'CL-003', 'CL-004', 'CL-005', 'CL-006', 'CL-007', 'CL-008'],
      },
    ],
  },

  // ── Fixed Fee ────────────────────────────────────────────────────────────
  {
    id: 'TPL-FIXED-FEE',
    type: 'fixed_fee',
    name: 'Fixed Fee',
    description: 'Milestone/deliverable-based template. Payment tied to deliverable acceptance, not hours. Requires clearly defined milestones with acceptance criteria and payment schedule.',
    version: 2,
    requiredFields: [
      'customer_id', 'msa_id', 'sow_title', 'project_description', 'start_date', 'end_date',
      'billing_model', 'payment_terms', 'scope_overview', 'in_scope_items',
      'out_of_scope_items', 'assumptions', 'milestone_table', 'resource_plan',
      'acceptance_criteria', 'acceptance_period', 'holiday_calendar', 'work_location',
      'dynpro_pm', 'customer_pm',
    ],
    approvalRules: STANDARD_APPROVAL_RULES,
    sections: [
      {
        id: 'sec_customer', title: '1. Customer Information', order: 1, required: true,
        description: 'Customer details, MSA linkage, and key contacts',
        fields: CUSTOMER_FIELDS,
      },
      {
        id: 'sec_project', title: '2. Engagement Overview', order: 2, required: true,
        description: 'Project title, description, dates, and billing model',
        fields: PROJECT_FIELDS,
      },
      {
        id: 'sec_scope', title: '3. Scope of Work', order: 3, required: true,
        description: 'Detailed scope with deliverables, exclusions, assumptions, and dependencies',
        fields: SCOPE_FIELDS,
      },
      {
        id: 'sec_milestones', title: '4. Milestones & Payment Schedule', order: 4, required: true,
        description: 'Deliverable milestones with due dates, acceptance criteria, and payment amounts. Total must equal SOW value.',
        fields: MILESTONE_FIELDS,
      },
      {
        id: 'sec_resources', title: '5. Resource Plan (Internal)', order: 5, required: true,
        description: 'Internal resource allocation for cost tracking. Not exposed to customer in fixed-fee model.',
        fields: [...RESOURCE_PLAN_FIELDS, ...HOLIDAY_FIELDS],
      },
      {
        id: 'sec_acceptance', title: '6. Acceptance Criteria', order: 6, required: true,
        description: 'How deliverables are reviewed, accepted, and warranted',
        fields: ACCEPTANCE_FIELDS,
      },
      {
        id: 'sec_governance', title: '7. Project Governance', order: 7, required: true,
        description: 'Full governance: PM assignments, escalation, reporting, communication',
        fields: GOVERNANCE_FIELDS,
      },
      {
        id: 'sec_change_mgmt', title: '8. Change Management', order: 8, required: true,
        description: 'Change order process with financial impact tracking',
        fields: [
          {
            id: 'change_request_process', label: 'Change Request Process', type: 'textarea', required: false,
            helpText: 'Critical for fixed-fee engagements — scope changes must be captured formally.',
            defaultValue: 'Changes to this SOW must be documented in a written Change Order signed by authorized representatives of both parties. Change Orders must include: description of change, impact to timeline, impact to cost, updated milestone schedule. No work shall commence on changes until a Change Order is fully executed.',
          },
        ],
        legalClauseIds: ['CL-005'],
      },
      {
        id: 'sec_legal', title: '9. Terms & Conditions', order: 9, required: true,
        description: 'Full legal terms auto-injected from MSA',
        fields: [],
        legalClauseIds: ['CL-001', 'CL-002', 'CL-003', 'CL-004', 'CL-005', 'CL-006', 'CL-007', 'CL-008'],
      },
    ],
  },
];

// ─── Helper Functions ──────────────────────────────────────────────────────────

export function getTemplateByType(type: SOWTemplateType): SOWTemplate | undefined {
  return SOW_TEMPLATES.find((t) => t.type === type);
}

export function getTemplateById(id: string): SOWTemplate | undefined {
  return SOW_TEMPLATES.find((t) => t.id === id);
}

export function getAllTemplates(): SOWTemplate[] {
  return [...SOW_TEMPLATES];
}

export function getApprovalChain(operatingMarginPercent: number): { approvers: string[]; description: string } {
  if (operatingMarginPercent >= 40) {
    return STANDARD_APPROVAL_RULES[0]!;
  } else if (operatingMarginPercent >= 35) {
    return STANDARD_APPROVAL_RULES[1]!;
  } else {
    return STANDARD_APPROVAL_RULES[2]!;
  }
}
