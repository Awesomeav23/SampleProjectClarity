/**
 * Legal MSA Clause Approvals
 *
 * Defines which MSA clauses are approved for auto-injection into SOW templates,
 * which require manual review, and customer-specific overrides.
 *
 * Stakeholder: Legal
 * Approved: 2026-04-10
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ClauseApprovalStatus = 'auto_inject' | 'manual_review' | 'blocked';

export interface ClauseApproval {
  clauseId: string;
  clauseType: string;
  title: string;
  status: ClauseApprovalStatus;
  applicableTemplates: ('lean_tm' | 'elaborate_tm' | 'fixed_fee')[];
  notes: string;
}

export interface CustomerClauseOverride {
  customerId: string;
  customerName: string;
  overrides: {
    clauseId: string;
    status: ClauseApprovalStatus;
    customText?: string;
    reason: string;
  }[];
}

export interface LegalSignOff {
  approvedBy: string;
  approvedDate: string;
  version: number;
  status: 'approved';
  notes: string;
}

// ─── Sign-Off ──────────────────────────────────────────────────────────────────

export const LEGAL_SIGN_OFF: LegalSignOff = {
  approvedBy: 'legal@dynpro.com',
  approvedDate: '2026-04-10',
  version: 1,
  status: 'approved',
  notes: 'Legal approved auto-injection of standard clauses for all three template types. Indemnification and liability cap require manual review for healthcare (HIPAA) and financial services clients. Customer-specific overrides documented below.',
};

// ─── Clause Approvals ──────────────────────────────────────────────────────────

export const CLAUSE_APPROVALS: ClauseApproval[] = [
  {
    clauseId: 'CL-001', clauseType: 'termination', title: 'Termination for Convenience',
    status: 'auto_inject', applicableTemplates: ['lean_tm', 'elaborate_tm', 'fixed_fee'],
    notes: 'Standard 30-day notice. Approved for all templates.',
  },
  {
    clauseId: 'CL-002', clauseType: 'confidentiality', title: 'Confidentiality',
    status: 'auto_inject', applicableTemplates: ['lean_tm', 'elaborate_tm', 'fixed_fee'],
    notes: '3-year confidentiality period. Approved for all templates.',
  },
  {
    clauseId: 'CL-003', clauseType: 'ip_ownership', title: 'Intellectual Property',
    status: 'auto_inject', applicableTemplates: ['elaborate_tm', 'fixed_fee'],
    notes: 'Work product owned by client upon full payment. Auto-inject for elaborate T&M and fixed fee. Lean T&M typically staff-aug so IP clause may not apply — manual review.',
  },
  {
    clauseId: 'CL-004', clauseType: 'liability_cap', title: 'Limitation of Liability',
    status: 'manual_review', applicableTemplates: ['elaborate_tm', 'fixed_fee'],
    notes: 'Liability cap tied to 12-month fees. Legal requires manual review for financial services and healthcare clients due to regulatory requirements.',
  },
  {
    clauseId: 'CL-005', clauseType: 'change_request', title: 'Change Request Process',
    status: 'auto_inject', applicableTemplates: ['lean_tm', 'elaborate_tm', 'fixed_fee'],
    notes: 'Critical for all SOW types. Must be included in every SOW per legal mandate.',
  },
  {
    clauseId: 'CL-006', clauseType: 'insurance', title: 'Insurance Requirements',
    status: 'auto_inject', applicableTemplates: ['elaborate_tm', 'fixed_fee'],
    notes: '$2M general liability, $5M professional liability. Standard for elaborate engagements.',
  },
  {
    clauseId: 'CL-007', clauseType: 'data_protection', title: 'Data Protection',
    status: 'manual_review', applicableTemplates: ['elaborate_tm', 'fixed_fee'],
    notes: 'Standard GDPR/CCPA language. Requires manual review for healthcare (HIPAA) clients — additional BAA language may be needed.',
  },
  {
    clauseId: 'CL-008', clauseType: 'indemnification', title: 'Indemnification',
    status: 'manual_review', applicableTemplates: ['elaborate_tm', 'fixed_fee'],
    notes: 'Mutual indemnification. Legal requires manual review for all clients — indemnification scope varies by industry and risk profile.',
  },
];

// ─── Customer-Specific Overrides ───────────────────────────────────────────────

export const CUSTOMER_CLAUSE_OVERRIDES: CustomerClauseOverride[] = [
  {
    customerId: 'C003', customerName: 'Globex',
    overrides: [
      {
        clauseId: 'CL-004', status: 'manual_review',
        reason: 'Financial services client — liability cap must be reviewed against regulatory requirements. May need higher cap.',
      },
      {
        clauseId: 'CL-007', status: 'manual_review',
        customText: 'DynPro shall comply with all applicable data protection laws including but not limited to SOX, GLBA, and PCI-DSS where applicable.',
        reason: 'Financial services — extended data protection language required.',
      },
    ],
  },
  {
    customerId: 'C005', customerName: 'HealthFirst Inc',
    overrides: [
      {
        clauseId: 'CL-007', status: 'blocked',
        reason: 'Healthcare client — standard data protection clause insufficient. Must use HIPAA-specific BAA language. Legal must draft custom clause.',
      },
      {
        clauseId: 'CL-008', status: 'manual_review',
        reason: 'Healthcare — indemnification scope must cover PHI breaches specifically.',
      },
    ],
  },
  {
    customerId: 'C001', customerName: 'SurveyMonkey',
    overrides: [
      {
        clauseId: 'CL-003', status: 'auto_inject',
        customText: 'All work product created by DynPro under this SOW shall be owned by Client upon full payment. DynPro retains a non-exclusive license to reuse general methodologies and frameworks.',
        reason: 'SurveyMonkey agreed to DynPro retaining methodology license in MSA negotiation.',
      },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getClauseApproval(clauseId: string): ClauseApproval | undefined {
  return CLAUSE_APPROVALS.find((c) => c.clauseId === clauseId);
}

export function getAutoInjectClauses(
  templateType: 'lean_tm' | 'elaborate_tm' | 'fixed_fee',
  customerId?: string
): { autoInject: ClauseApproval[]; manualReview: ClauseApproval[]; blocked: ClauseApproval[] } {
  const applicableClauses = CLAUSE_APPROVALS.filter((c) =>
    c.applicableTemplates.includes(templateType)
  );

  // Apply customer overrides
  const customerOverrides = customerId
    ? CUSTOMER_CLAUSE_OVERRIDES.find((o) => o.customerId === customerId)?.overrides ?? []
    : [];

  const resolvedClauses = applicableClauses.map((clause) => {
    const override = customerOverrides.find((o) => o.clauseId === clause.clauseId);
    if (override) {
      return { ...clause, status: override.status, notes: `${clause.notes} | OVERRIDE: ${override.reason}` };
    }
    return clause;
  });

  return {
    autoInject: resolvedClauses.filter((c) => c.status === 'auto_inject'),
    manualReview: resolvedClauses.filter((c) => c.status === 'manual_review'),
    blocked: resolvedClauses.filter((c) => c.status === 'blocked'),
  };
}
