/**
 * Centralized mock data for Project Clarity
 * Based on the business case document — uses realistic names, roles, rates, and scenarios.
 * This file is the single source of truth for all mock/seed data across services.
 */

// ─── Locations & Calendars ─────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  country: string;
  timezone: string;
  standardHoursPerWeek: number;
}

export const LOCATIONS: Location[] = [
  { id: 'LOC-US', name: 'United States', country: 'US', timezone: 'America/New_York', standardHoursPerWeek: 40 },
  { id: 'LOC-IN-PUNE', name: 'India - Pune', country: 'IN', timezone: 'Asia/Kolkata', standardHoursPerWeek: 40 },
  { id: 'LOC-IN-MOHALI', name: 'India - Mohali', country: 'IN', timezone: 'Asia/Kolkata', standardHoursPerWeek: 40 },
];

export interface Holiday {
  date: string; // ISO date
  name: string;
  locationIds: string[]; // which locations observe this
}

export const HOLIDAYS_2026: Holiday[] = [
  // US Holidays
  { date: '2026-01-01', name: "New Year's Day", locationIds: ['LOC-US', 'LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day', locationIds: ['LOC-US'] },
  { date: '2026-02-16', name: "Presidents' Day", locationIds: ['LOC-US'] },
  { date: '2026-05-25', name: 'Memorial Day', locationIds: ['LOC-US'] },
  { date: '2026-07-04', name: 'Independence Day (US)', locationIds: ['LOC-US'] },
  { date: '2026-09-07', name: 'Labor Day', locationIds: ['LOC-US'] },
  { date: '2026-11-26', name: 'Thanksgiving', locationIds: ['LOC-US'] },
  { date: '2026-12-25', name: 'Christmas Day', locationIds: ['LOC-US', 'LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  // India Holidays
  { date: '2026-01-26', name: 'Republic Day', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-03-10', name: 'Holi', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-08-15', name: 'Independence Day (India)', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-10-02', name: 'Gandhi Jayanti', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-10-20', name: 'Diwali', locationIds: ['LOC-IN-PUNE', 'LOC-IN-MOHALI'] },
  { date: '2026-11-04', name: 'Guru Nanak Jayanti', locationIds: ['LOC-IN-MOHALI'] },
];

// Customer-specific holidays (some customers observe extra days)
export interface CustomerHolidayCalendar {
  customerId: string;
  additionalHolidays: Holiday[];
}

export const CUSTOMER_HOLIDAY_CALENDARS: CustomerHolidayCalendar[] = [
  {
    customerId: 'C001',
    additionalHolidays: [
      { date: '2026-06-19', name: 'Juneteenth (SurveyMonkey)', locationIds: ['LOC-US'] },
      { date: '2026-12-26', name: 'Day After Christmas (SurveyMonkey)', locationIds: ['LOC-US'] },
    ],
  },
  {
    customerId: 'C004',
    additionalHolidays: [
      { date: '2026-11-27', name: 'Day After Thanksgiving (TechCorp)', locationIds: ['LOC-US'] },
    ],
  },
];

// ─── Roles & Skills Taxonomy ───────────────────────────────────────────────────

export interface Role {
  id: string;
  title: string;
  practice: string;
  subPractice: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | 'Architect';
  standardRates: {
    locationId: string;
    billRate: number; // $/hr market rate
    flc: number;     // $/hr fully loaded cost
  }[];
}

export const ROLES: Role[] = [
  {
    id: 'ROLE-001', title: 'Solutions Architect', practice: 'Engineering', subPractice: 'Architecture',
    level: 'Architect',
    standardRates: [
      { locationId: 'LOC-US', billRate: 185, flc: 95 },
      { locationId: 'LOC-IN-PUNE', billRate: 130, flc: 45 },
    ],
  },
  {
    id: 'ROLE-002', title: 'Senior Developer', practice: 'Engineering', subPractice: 'Application Development',
    level: 'Senior',
    standardRates: [
      { locationId: 'LOC-US', billRate: 150, flc: 80 },
      { locationId: 'LOC-IN-PUNE', billRate: 100, flc: 35 },
      { locationId: 'LOC-IN-MOHALI', billRate: 95, flc: 32 },
    ],
  },
  {
    id: 'ROLE-003', title: 'Developer', practice: 'Engineering', subPractice: 'Application Development',
    level: 'Mid',
    standardRates: [
      { locationId: 'LOC-US', billRate: 130, flc: 68 },
      { locationId: 'LOC-IN-PUNE', billRate: 85, flc: 28 },
      { locationId: 'LOC-IN-MOHALI', billRate: 80, flc: 26 },
    ],
  },
  {
    id: 'ROLE-004', title: 'QA Engineer', practice: 'Quality Assurance', subPractice: 'Test Engineering',
    level: 'Mid',
    standardRates: [
      { locationId: 'LOC-US', billRate: 120, flc: 62 },
      { locationId: 'LOC-IN-PUNE', billRate: 75, flc: 25 },
      { locationId: 'LOC-IN-MOHALI', billRate: 70, flc: 23 },
    ],
  },
  {
    id: 'ROLE-005', title: 'Project Manager', practice: 'Delivery', subPractice: 'Project Management',
    level: 'Senior',
    standardRates: [
      { locationId: 'LOC-US', billRate: 160, flc: 85 },
      { locationId: 'LOC-IN-PUNE', billRate: 110, flc: 40 },
    ],
  },
  {
    id: 'ROLE-006', title: 'Workato Engineer', practice: 'Engineering', subPractice: 'Integration',
    level: 'Mid',
    standardRates: [
      { locationId: 'LOC-US', billRate: 140, flc: 72 },
      { locationId: 'LOC-IN-PUNE', billRate: 90, flc: 30 },
    ],
  },
  {
    id: 'ROLE-007', title: 'Data Engineer', practice: 'Engineering', subPractice: 'Data & Analytics',
    level: 'Senior',
    standardRates: [
      { locationId: 'LOC-US', billRate: 155, flc: 82 },
      { locationId: 'LOC-IN-PUNE', billRate: 105, flc: 36 },
    ],
  },
  {
    id: 'ROLE-008', title: 'Business Analyst', practice: 'Delivery', subPractice: 'Business Analysis',
    level: 'Mid',
    standardRates: [
      { locationId: 'LOC-US', billRate: 125, flc: 65 },
      { locationId: 'LOC-IN-PUNE', billRate: 80, flc: 27 },
    ],
  },
  {
    id: 'ROLE-009', title: 'DevOps Engineer', practice: 'Engineering', subPractice: 'Infrastructure',
    level: 'Senior',
    standardRates: [
      { locationId: 'LOC-US', billRate: 155, flc: 83 },
      { locationId: 'LOC-IN-PUNE', billRate: 100, flc: 34 },
    ],
  },
  {
    id: 'ROLE-010', title: 'UX Designer', practice: 'Design', subPractice: 'User Experience',
    level: 'Mid',
    standardRates: [
      { locationId: 'LOC-US', billRate: 135, flc: 70 },
    ],
  },
];

export interface Skill {
  id: string;
  name: string;
  competency: string;
  subPractice: string;
  practice: string;
}

export const SKILLS: Skill[] = [
  { id: 'SK-001', name: 'React', competency: 'Frontend Frameworks', subPractice: 'Application Development', practice: 'Engineering' },
  { id: 'SK-002', name: 'Node.js', competency: 'Backend Frameworks', subPractice: 'Application Development', practice: 'Engineering' },
  { id: 'SK-003', name: 'TypeScript', competency: 'Programming Languages', subPractice: 'Application Development', practice: 'Engineering' },
  { id: 'SK-004', name: 'PostgreSQL', competency: 'Databases', subPractice: 'Data & Analytics', practice: 'Engineering' },
  { id: 'SK-005', name: 'Workato', competency: 'Integration Platforms', subPractice: 'Integration', practice: 'Engineering' },
  { id: 'SK-006', name: 'Selenium', competency: 'Test Automation', subPractice: 'Test Engineering', practice: 'Quality Assurance' },
  { id: 'SK-007', name: 'AWS', competency: 'Cloud Platforms', subPractice: 'Infrastructure', practice: 'Engineering' },
  { id: 'SK-008', name: 'Python', competency: 'Programming Languages', subPractice: 'Data & Analytics', practice: 'Engineering' },
  { id: 'SK-009', name: 'Figma', competency: 'Design Tools', subPractice: 'User Experience', practice: 'Design' },
  { id: 'SK-010', name: 'Terraform', competency: 'Infrastructure as Code', subPractice: 'Infrastructure', practice: 'Engineering' },
  { id: 'SK-011', name: 'Java', competency: 'Programming Languages', subPractice: 'Application Development', practice: 'Engineering' },
  { id: 'SK-012', name: 'Salesforce', competency: 'CRM Platforms', subPractice: 'Integration', practice: 'Engineering' },
];

// ─── Customers ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  industry: string;
  msaId: string | null;
  primaryContactName: string;
  primaryContactEmail: string;
  paymentTerms: 'Net-30' | 'Net-45' | 'Net-60';
  status: 'active' | 'prospect' | 'inactive';
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'C001', name: 'SurveyMonkey', industry: 'Technology',
    msaId: 'MSA-001', primaryContactName: 'Lisa Park', primaryContactEmail: 'lisa.park@surveymonkey.com',
    paymentTerms: 'Net-30', status: 'active',
  },
  {
    id: 'C002', name: 'Acme Corp', industry: 'Manufacturing',
    msaId: 'MSA-002', primaryContactName: 'David Wilson', primaryContactEmail: 'dwilson@acmecorp.com',
    paymentTerms: 'Net-45', status: 'active',
  },
  {
    id: 'C003', name: 'Globex', industry: 'Financial Services',
    msaId: 'MSA-003', primaryContactName: 'Sarah Chen', primaryContactEmail: 'schen@globex.com',
    paymentTerms: 'Net-30', status: 'active',
  },
  {
    id: 'C004', name: 'TechCorp Solutions', industry: 'Technology',
    msaId: 'MSA-004', primaryContactName: 'James Miller', primaryContactEmail: 'jmiller@techcorp.com',
    paymentTerms: 'Net-30', status: 'active',
  },
  {
    id: 'C005', name: 'HealthFirst Inc', industry: 'Healthcare',
    msaId: null, primaryContactName: 'Dr. Anita Rao', primaryContactEmail: 'arao@healthfirst.com',
    paymentTerms: 'Net-60', status: 'prospect',
  },
  {
    id: 'C006', name: 'RetailMax', industry: 'Retail',
    msaId: 'MSA-005', primaryContactName: 'Tom Bradley', primaryContactEmail: 'tbradley@retailmax.com',
    paymentTerms: 'Net-45', status: 'active',
  },
];

// ─── MSAs ──────────────────────────────────────────────────────────────────────

export interface MSA {
  id: string;
  customerId: string;
  signedDate: string;
  expirationDate: string;
  autoRenew: boolean;
  paymentTerms: 'Net-30' | 'Net-45' | 'Net-60';
  governingLaw: string;
  clauses: MSAClause[];
  status: 'active' | 'expired' | 'pending_renewal';
}

export interface MSAClause {
  id: string;
  type: 'indemnification' | 'liability_cap' | 'termination' | 'ip_ownership' | 'confidentiality' | 'change_request' | 'insurance' | 'data_protection';
  title: string;
  text: string;
}

const STANDARD_CLAUSES: MSAClause[] = [
  {
    id: 'CL-001', type: 'termination', title: 'Termination for Convenience',
    text: 'Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party.',
  },
  {
    id: 'CL-002', type: 'confidentiality', title: 'Confidentiality',
    text: 'Each party agrees to hold the other party\'s Confidential Information in strict confidence for a period of three (3) years following disclosure.',
  },
  {
    id: 'CL-003', type: 'ip_ownership', title: 'Intellectual Property',
    text: 'All work product created by DynPro under a SOW shall be owned by Client upon full payment.',
  },
  {
    id: 'CL-004', type: 'liability_cap', title: 'Limitation of Liability',
    text: 'Neither party\'s aggregate liability shall exceed the total fees paid or payable under the applicable SOW in the twelve (12) months preceding the claim.',
  },
  {
    id: 'CL-005', type: 'change_request', title: 'Change Request Process',
    text: 'Changes to any SOW must be documented in a written Change Order signed by authorized representatives of both parties. No work shall commence on changes until a Change Order is fully executed.',
  },
  {
    id: 'CL-006', type: 'insurance', title: 'Insurance Requirements',
    text: 'DynPro shall maintain Commercial General Liability insurance of not less than $2,000,000 per occurrence and Professional Liability insurance of not less than $5,000,000.',
  },
  {
    id: 'CL-007', type: 'data_protection', title: 'Data Protection',
    text: 'DynPro shall comply with all applicable data protection laws and shall implement appropriate technical and organizational measures to protect personal data.',
  },
  {
    id: 'CL-008', type: 'indemnification', title: 'Indemnification',
    text: 'Each party shall indemnify and hold harmless the other party from any third-party claims arising from a breach of this Agreement.',
  },
];

export const MSAS: MSA[] = [
  {
    id: 'MSA-001', customerId: 'C001', signedDate: '2024-06-15', expirationDate: '2027-06-14',
    autoRenew: true, paymentTerms: 'Net-30', governingLaw: 'State of California',
    clauses: STANDARD_CLAUSES, status: 'active',
  },
  {
    id: 'MSA-002', customerId: 'C002', signedDate: '2025-01-10', expirationDate: '2027-01-09',
    autoRenew: false, paymentTerms: 'Net-45', governingLaw: 'State of New York',
    clauses: STANDARD_CLAUSES.filter(c => c.type !== 'data_protection'), status: 'active',
  },
  {
    id: 'MSA-003', customerId: 'C003', signedDate: '2024-03-01', expirationDate: '2026-02-28',
    autoRenew: true, paymentTerms: 'Net-30', governingLaw: 'State of Delaware',
    clauses: [...STANDARD_CLAUSES], status: 'pending_renewal',
  },
  {
    id: 'MSA-004', customerId: 'C004', signedDate: '2025-09-01', expirationDate: '2028-08-31',
    autoRenew: true, paymentTerms: 'Net-30', governingLaw: 'State of Texas',
    clauses: STANDARD_CLAUSES, status: 'active',
  },
  {
    id: 'MSA-005', customerId: 'C006', signedDate: '2025-04-15', expirationDate: '2027-04-14',
    autoRenew: false, paymentTerms: 'Net-45', governingLaw: 'State of Illinois',
    clauses: STANDARD_CLAUSES.filter(c => c.type !== 'insurance'), status: 'active',
  },
];

// ─── Resources (Employees) ─────────────────────────────────────────────────────

export interface Resource {
  id: string;
  jobdivaEmployeeId: string;
  name: string;
  email: string;
  roleId: string;
  locationId: string;
  managerId: string | null;
  buPractice: string;
  flcPerHour: number;
  startDate: string; // employment start
  skills: string[];  // skill IDs
  status: 'active' | 'bench' | 'exiting';
}

export const RESOURCES: Resource[] = [
  {
    id: 'R001', jobdivaEmployeeId: 'JD-EMP-1001', name: 'Romy Sharma', email: 'romy.sharma@dynpro.com',
    roleId: 'ROLE-002', locationId: 'LOC-IN-PUNE', managerId: 'R004', buPractice: 'Engineering',
    flcPerHour: 35, startDate: '2022-03-15', skills: ['SK-001', 'SK-002', 'SK-003'], status: 'active',
  },
  {
    id: 'R002', jobdivaEmployeeId: 'JD-EMP-1002', name: 'Alex Chen', email: 'alex.chen@dynpro.com',
    roleId: 'ROLE-001', locationId: 'LOC-US', managerId: null, buPractice: 'Engineering',
    flcPerHour: 95, startDate: '2020-08-01', skills: ['SK-002', 'SK-003', 'SK-004', 'SK-007'], status: 'active',
  },
  {
    id: 'R003', jobdivaEmployeeId: 'JD-EMP-1003', name: 'Priya Patel', email: 'priya.patel@dynpro.com',
    roleId: 'ROLE-004', locationId: 'LOC-IN-MOHALI', managerId: 'R004', buPractice: 'Quality Assurance',
    flcPerHour: 23, startDate: '2023-01-10', skills: ['SK-006', 'SK-003'], status: 'active',
  },
  {
    id: 'R004', jobdivaEmployeeId: 'JD-EMP-1004', name: 'Marcus Johnson', email: 'marcus.johnson@dynpro.com',
    roleId: 'ROLE-005', locationId: 'LOC-US', managerId: null, buPractice: 'Delivery',
    flcPerHour: 85, startDate: '2019-05-20', skills: [], status: 'active',
  },
  {
    id: 'R005', jobdivaEmployeeId: 'JD-EMP-1005', name: 'Neha Gupta', email: 'neha.gupta@dynpro.com',
    roleId: 'ROLE-006', locationId: 'LOC-IN-PUNE', managerId: 'R004', buPractice: 'Engineering',
    flcPerHour: 30, startDate: '2023-06-01', skills: ['SK-005', 'SK-012'], status: 'active',
  },
  {
    id: 'R006', jobdivaEmployeeId: 'JD-EMP-1006', name: 'Samantha Lee', email: 'samantha.lee@dynpro.com',
    roleId: 'ROLE-003', locationId: 'LOC-US', managerId: 'R002', buPractice: 'Engineering',
    flcPerHour: 68, startDate: '2021-11-15', skills: ['SK-001', 'SK-003', 'SK-008'], status: 'active',
  },
  {
    id: 'R007', jobdivaEmployeeId: 'JD-EMP-1007', name: 'Vikram Singh', email: 'vikram.singh@dynpro.com',
    roleId: 'ROLE-007', locationId: 'LOC-IN-PUNE', managerId: 'R002', buPractice: 'Engineering',
    flcPerHour: 36, startDate: '2022-09-01', skills: ['SK-004', 'SK-008', 'SK-007'], status: 'active',
  },
  {
    id: 'R008', jobdivaEmployeeId: 'JD-EMP-1008', name: 'Jennifer Adams', email: 'jennifer.adams@dynpro.com',
    roleId: 'ROLE-008', locationId: 'LOC-US', managerId: 'R004', buPractice: 'Delivery',
    flcPerHour: 65, startDate: '2023-02-20', skills: [], status: 'active',
  },
  {
    id: 'R009', jobdivaEmployeeId: 'JD-EMP-1009', name: 'Arjun Mehta', email: 'arjun.mehta@dynpro.com',
    roleId: 'ROLE-009', locationId: 'LOC-IN-PUNE', managerId: 'R002', buPractice: 'Engineering',
    flcPerHour: 34, startDate: '2021-04-10', skills: ['SK-007', 'SK-010'], status: 'active',
  },
  {
    id: 'R010', jobdivaEmployeeId: 'JD-EMP-1010', name: 'Emily Carter', email: 'emily.carter@dynpro.com',
    roleId: 'ROLE-010', locationId: 'LOC-US', managerId: 'R004', buPractice: 'Design',
    flcPerHour: 70, startDate: '2024-01-08', skills: ['SK-009'], status: 'active',
  },
  {
    id: 'R011', jobdivaEmployeeId: 'JD-EMP-1011', name: 'Rajesh Kumar', email: 'rajesh.kumar@dynpro.com',
    roleId: 'ROLE-002', locationId: 'LOC-IN-MOHALI', managerId: 'R002', buPractice: 'Engineering',
    flcPerHour: 32, startDate: '2022-07-15', skills: ['SK-002', 'SK-003', 'SK-011'], status: 'active',
  },
  {
    id: 'R012', jobdivaEmployeeId: 'JD-EMP-1012', name: 'Karen Mitchell', email: 'karen.mitchell@dynpro.com',
    roleId: 'ROLE-003', locationId: 'LOC-US', managerId: 'R002', buPractice: 'Engineering',
    flcPerHour: 68, startDate: '2024-03-01', skills: ['SK-001', 'SK-002', 'SK-003'], status: 'bench',
  },
];

// ─── Projects & Opportunities ──────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  customerId: string;
  sowId: string | null;
  type: 'lean_tm' | 'elaborate_tm' | 'fixed_fee' | 'milestone';
  status: 'pipeline' | 'active' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  totalValue: number;
  plannedMarginPercent: number;
}

export const PROJECTS: Project[] = [
  {
    id: 'P001', name: 'SurveyMonkey Integration', customerId: 'C001', sowId: 'SOW-001',
    type: 'elaborate_tm', status: 'active', startDate: '2026-01-15', endDate: '2026-06-30',
    totalValue: 285000, plannedMarginPercent: 47.7,
  },
  {
    id: 'P002', name: 'Acme CRM Migration', customerId: 'C002', sowId: 'SOW-002',
    type: 'fixed_fee', status: 'active', startDate: '2026-02-01', endDate: '2026-07-31',
    totalValue: 420000, plannedMarginPercent: 44.2,
  },
  {
    id: 'P003', name: 'Globex Data Platform', customerId: 'C003', sowId: 'SOW-003',
    type: 'lean_tm', status: 'active', startDate: '2026-03-01', endDate: '2026-08-31',
    totalValue: 195000, plannedMarginPercent: 51.3,
  },
  {
    id: 'P004', name: 'TechCorp Cloud Migration', customerId: 'C004', sowId: 'SOW-004',
    type: 'elaborate_tm', status: 'active', startDate: '2026-04-01', endDate: '2026-09-30',
    totalValue: 510000, plannedMarginPercent: 49.1,
  },
  {
    id: 'P005', name: 'HealthFirst Portal MVP', customerId: 'C005', sowId: null,
    type: 'fixed_fee', status: 'pipeline', startDate: '2026-06-01', endDate: '2026-11-30',
    totalValue: 350000, plannedMarginPercent: 38.5, // below 40% — needs SLT approval
  },
  {
    id: 'P006', name: 'RetailMax Inventory System', customerId: 'C006', sowId: 'SOW-005',
    type: 'lean_tm', status: 'active', startDate: '2026-03-15', endDate: '2026-06-15',
    totalValue: 120000, plannedMarginPercent: 52.0,
  },
];

// ─── Opportunities (Pipeline / Pre-SOW) ────────────────────────────────────────

export interface Opportunity {
  id: string;
  customerId: string;
  title: string;
  estimatedValue: number;
  probability: number; // 0-100
  expectedCloseDate: string;
  status: 'prospecting' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes: string;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'OPP-001', customerId: 'C005', title: 'HealthFirst Patient Portal',
    estimatedValue: 350000, probability: 65, expectedCloseDate: '2026-05-15',
    status: 'negotiation', notes: 'Requires HIPAA compliance review. Margin at 38.5% — SLT approval needed.',
  },
  {
    id: 'OPP-002', customerId: 'C001', title: 'SurveyMonkey Phase 2 - Analytics',
    estimatedValue: 180000, probability: 80, expectedCloseDate: '2026-06-01',
    status: 'proposal', notes: 'Follow-on from current integration project. Client very satisfied.',
  },
  {
    id: 'OPP-003', customerId: 'C004', title: 'TechCorp DevOps Transformation',
    estimatedValue: 275000, probability: 40, expectedCloseDate: '2026-07-15',
    status: 'prospecting', notes: 'Early stage. Competing with two other vendors.',
  },
  {
    id: 'OPP-004', customerId: 'C006', title: 'RetailMax E-Commerce Replatform',
    estimatedValue: 600000, probability: 55, expectedCloseDate: '2026-08-01',
    status: 'proposal', notes: 'Large engagement. Would need 8-10 resources if won.',
  },
];

// ─── SOWs ──────────────────────────────────────────────────────────────────────

export interface SOW {
  id: string;
  customerId: string;
  projectId: string;
  msaId: string;
  title: string;
  type: 'lean_tm' | 'elaborate_tm' | 'fixed_fee';
  status: 'draft' | 'pending_approval' | 'approved' | 'signed' | 'active' | 'completed' | 'cancelled';
  totalValue: number;
  operatingMarginPercent: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  approvedBy: string | null;
  signedDate: string | null;
  effectiveDate: string | null;
  docusignEnvelopeId: string | null;
  sharepointDocUrl: string | null;
  changeOrders: ChangeOrder[];
}

export interface ChangeOrder {
  id: string;
  sowId: string;
  type: 'timeline' | 'resource' | 'scope';
  description: string;
  additions: number;
  credits: number;
  netImpact: number;
  status: 'draft' | 'approved' | 'rejected';
  createdDate: string;
  approvedDate: string | null;
}

export const SOWS: SOW[] = [
  {
    id: 'SOW-001', customerId: 'C001', projectId: 'P001', msaId: 'MSA-001',
    title: 'SurveyMonkey Workato Integration Services', type: 'elaborate_tm',
    status: 'active', totalValue: 285000, operatingMarginPercent: 47.7,
    startDate: '2026-01-15', endDate: '2026-06-30',
    createdBy: 'sharath@dynpro.com', approvedBy: 'madhup@dynpro.com',
    signedDate: '2026-01-10', effectiveDate: '2026-01-15',
    docusignEnvelopeId: 'DS-ENV-001', sharepointDocUrl: '/PMO/ProjectClarity/SOWs/SOW-001-SurveyMonkey.pdf',
    changeOrders: [
      {
        id: 'CO-001', sowId: 'SOW-001', type: 'timeline',
        description: 'Timeline extension Mar 27 → Apr 10, additional Workato engineering hours',
        additions: 17407, credits: 5200, netImpact: 12207,
        status: 'approved', createdDate: '2026-03-20', approvedDate: '2026-03-22',
      },
    ],
  },
  {
    id: 'SOW-002', customerId: 'C002', projectId: 'P002', msaId: 'MSA-002',
    title: 'Acme Corp CRM Migration and Data Remediation', type: 'fixed_fee',
    status: 'active', totalValue: 420000, operatingMarginPercent: 44.2,
    startDate: '2026-02-01', endDate: '2026-07-31',
    createdBy: 'sharath@dynpro.com', approvedBy: 'madhup@dynpro.com',
    signedDate: '2026-01-28', effectiveDate: '2026-02-01',
    docusignEnvelopeId: 'DS-ENV-002', sharepointDocUrl: '/PMO/ProjectClarity/SOWs/SOW-002-AcmeCRM.pdf',
    changeOrders: [],
  },
  {
    id: 'SOW-003', customerId: 'C003', projectId: 'P003', msaId: 'MSA-003',
    title: 'Globex Real-Time Data Platform', type: 'lean_tm',
    status: 'active', totalValue: 195000, operatingMarginPercent: 51.3,
    startDate: '2026-03-01', endDate: '2026-08-31',
    createdBy: 'sharath@dynpro.com', approvedBy: 'aishwarya@dynpro.com',
    signedDate: '2026-02-25', effectiveDate: '2026-03-01',
    docusignEnvelopeId: 'DS-ENV-003', sharepointDocUrl: '/PMO/ProjectClarity/SOWs/SOW-003-Globex.pdf',
    changeOrders: [],
  },
  {
    id: 'SOW-004', customerId: 'C004', projectId: 'P004', msaId: 'MSA-004',
    title: 'TechCorp Cloud Infrastructure Migration', type: 'elaborate_tm',
    status: 'active', totalValue: 510000, operatingMarginPercent: 49.1,
    startDate: '2026-04-01', endDate: '2026-09-30',
    createdBy: 'sharath@dynpro.com', approvedBy: 'madhup@dynpro.com',
    signedDate: '2026-03-28', effectiveDate: '2026-04-01',
    docusignEnvelopeId: 'DS-ENV-004', sharepointDocUrl: '/PMO/ProjectClarity/SOWs/SOW-004-TechCorp.pdf',
    changeOrders: [],
  },
  {
    id: 'SOW-005', customerId: 'C006', projectId: 'P006', msaId: 'MSA-005',
    title: 'RetailMax Inventory Management Enhancement', type: 'lean_tm',
    status: 'active', totalValue: 120000, operatingMarginPercent: 52.0,
    startDate: '2026-03-15', endDate: '2026-06-15',
    createdBy: 'sharath@dynpro.com', approvedBy: 'aishwarya@dynpro.com',
    signedDate: '2026-03-12', effectiveDate: '2026-03-15',
    docusignEnvelopeId: 'DS-ENV-005', sharepointDocUrl: '/PMO/ProjectClarity/SOWs/SOW-005-RetailMax.pdf',
    changeOrders: [],
  },
];

// ─── Timesheets ────────────────────────────────────────────────────────────────

export interface TimesheetEntry {
  id: string;
  resourceId: string;
  projectId: string;
  weekStartDate: string; // Monday of the week
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approvedBy: string | null;
  submittedAt: string | null;
}

export const TIMESHEET_ENTRIES: TimesheetEntry[] = [
  // Week of April 6, 2026
  {
    id: 'TS-001', resourceId: 'R001', projectId: 'P001', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    totalHours: 40, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T17:00:00Z',
  },
  {
    id: 'TS-002', resourceId: 'R002', projectId: 'P004', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 9, wednesday: 8, thursday: 9, friday: 8, saturday: 4, sunday: 0,
    totalHours: 46, status: 'approved', approvedBy: 'madhup@dynpro.com', submittedAt: '2026-04-10T18:30:00Z',
  },
  {
    id: 'TS-003', resourceId: 'R003', projectId: 'P001', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    totalHours: 40, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T16:45:00Z',
  },
  {
    id: 'TS-004', resourceId: 'R005', projectId: 'P001', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 4, saturday: 0, sunday: 0,
    totalHours: 36, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T17:15:00Z',
  },
  {
    id: 'TS-005', resourceId: 'R006', projectId: 'P002', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    totalHours: 40, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T17:00:00Z',
  },
  {
    id: 'TS-006', resourceId: 'R007', projectId: 'P003', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    totalHours: 40, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T16:30:00Z',
  },
  {
    id: 'TS-007', resourceId: 'R009', projectId: 'P004', weekStartDate: '2026-04-06',
    monday: 8, tuesday: 8, wednesday: 10, thursday: 8, friday: 8, saturday: 2, sunday: 0,
    totalHours: 44, status: 'approved', approvedBy: 'marcus.johnson@dynpro.com', submittedAt: '2026-04-10T18:00:00Z',
  },
  // Week of April 13, 2026
  {
    id: 'TS-008', resourceId: 'R001', projectId: 'P001', weekStartDate: '2026-04-13',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 0, saturday: 0, sunday: 0,
    totalHours: 32, status: 'submitted', approvedBy: null, submittedAt: '2026-04-17T17:00:00Z',
  },
  {
    id: 'TS-009', resourceId: 'R002', projectId: 'P004', weekStartDate: '2026-04-13',
    monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    totalHours: 40, status: 'submitted', approvedBy: null, submittedAt: '2026-04-17T18:00:00Z',
  },
  {
    id: 'TS-010', resourceId: 'R012', projectId: 'P002', weekStartDate: '2026-04-13',
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
    totalHours: 0, status: 'draft', approvedBy: null, submittedAt: null, // bench resource, no hours
  },
];

// ─── Resource Allocations (who is on what project, at what %) ──────────────────

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  projectId: string;
  roleId: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
  billRate: number;
  type: 'baseline' | 'execution';
}

export const RESOURCE_ALLOCATIONS: ResourceAllocation[] = [
  // P001 - SurveyMonkey Integration
  { id: 'RA-001', resourceId: 'R001', projectId: 'P001', roleId: 'ROLE-002', startDate: '2026-01-15', endDate: '2026-06-30', allocationPercent: 100, billRate: 100, type: 'execution' },
  { id: 'RA-002', resourceId: 'R003', projectId: 'P001', roleId: 'ROLE-004', startDate: '2026-02-01', endDate: '2026-06-30', allocationPercent: 50, billRate: 70, type: 'execution' },
  { id: 'RA-003', resourceId: 'R005', projectId: 'P001', roleId: 'ROLE-006', startDate: '2026-01-15', endDate: '2026-04-10', allocationPercent: 100, billRate: 90, type: 'execution' },
  // P002 - Acme CRM Migration
  { id: 'RA-004', resourceId: 'R006', projectId: 'P002', roleId: 'ROLE-003', startDate: '2026-02-01', endDate: '2026-07-31', allocationPercent: 100, billRate: 130, type: 'execution' },
  { id: 'RA-005', resourceId: 'R008', projectId: 'P002', roleId: 'ROLE-008', startDate: '2026-02-01', endDate: '2026-05-31', allocationPercent: 50, billRate: 125, type: 'execution' },
  // P003 - Globex Data Platform
  { id: 'RA-006', resourceId: 'R007', projectId: 'P003', roleId: 'ROLE-007', startDate: '2026-03-01', endDate: '2026-08-31', allocationPercent: 100, billRate: 105, type: 'execution' },
  // P004 - TechCorp Cloud Migration
  { id: 'RA-007', resourceId: 'R002', projectId: 'P004', roleId: 'ROLE-001', startDate: '2026-04-01', endDate: '2026-09-30', allocationPercent: 75, billRate: 185, type: 'execution' },
  { id: 'RA-008', resourceId: 'R009', projectId: 'P004', roleId: 'ROLE-009', startDate: '2026-04-01', endDate: '2026-09-30', allocationPercent: 100, billRate: 100, type: 'execution' },
  { id: 'RA-009', resourceId: 'R011', projectId: 'P004', roleId: 'ROLE-002', startDate: '2026-04-01', endDate: '2026-09-30', allocationPercent: 100, billRate: 95, type: 'execution' },
  // P006 - RetailMax Inventory
  { id: 'RA-010', resourceId: 'R010', projectId: 'P006', roleId: 'ROLE-010', startDate: '2026-03-15', endDate: '2026-04-30', allocationPercent: 50, billRate: 135, type: 'execution' },
  { id: 'RA-011', resourceId: 'R003', projectId: 'P006', roleId: 'ROLE-004', startDate: '2026-04-01', endDate: '2026-06-15', allocationPercent: 50, billRate: 70, type: 'execution' },
  // Note: R001 at 100% + R003 at 50%+50% = 100%, R002 at 75%, R012 at 0% (bench)
  // Romy (R001) is at 100% on one project — matches the doc's mention of high utilization
];

// ─── DynPro Internal Stakeholders ──────────────────────────────────────────────

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalAuthority: boolean;
  approvalThreshold: number | null; // margin % below which they must approve
}

export const STAKEHOLDERS: Stakeholder[] = [
  { id: 'STK-001', name: 'Sharath', email: 'sharath@dynpro.com', role: 'Finance Head / SOW Creator', approvalAuthority: false, approvalThreshold: null },
  { id: 'STK-002', name: 'Sharad', email: 'sharad@dynpro.com', role: 'Project Manager', approvalAuthority: false, approvalThreshold: null },
  { id: 'STK-003', name: 'Madhup', email: 'madhup@dynpro.com', role: 'Finance/Operations', approvalAuthority: true, approvalThreshold: 40 },
  { id: 'STK-004', name: 'Aishwarya', email: 'aishwarya@dynpro.com', role: 'Finance/Operations', approvalAuthority: true, approvalThreshold: 40 },
  { id: 'STK-005', name: 'BU Head', email: 'bu-head@dynpro.com', role: 'BU Head', approvalAuthority: true, approvalThreshold: 40 },
  { id: 'STK-006', name: 'CRO', email: 'cro@dynpro.com', role: 'Chief Revenue Officer', approvalAuthority: true, approvalThreshold: 35 },
  { id: 'STK-007', name: 'Shiv', email: 'shiv@dynpro.com', role: 'Executive Leadership', approvalAuthority: true, approvalThreshold: 30 },
  { id: 'STK-008', name: 'Ash', email: 'ash@dynpro.com', role: 'Back Office', approvalAuthority: false, approvalThreshold: null },
  { id: 'STK-009', name: 'Ankit', email: 'ankit@dynpro.com', role: 'Back Office', approvalAuthority: false, approvalThreshold: null },
  { id: 'STK-010', name: 'Naveen', email: 'naveen@dynpro.com', role: 'Back Office / PMO', approvalAuthority: false, approvalThreshold: null },
];
