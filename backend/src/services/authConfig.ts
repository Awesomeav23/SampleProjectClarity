/**
 * Auth & Security Configuration
 *
 * Mock IT/Security sign-off for:
 *   - OAuth 2.0 provider setup
 *   - JWT token configuration
 *   - Role-based access control (RBAC)
 *   - Row-level security rules
 *   - Data residency requirements
 *
 * Stakeholder: IT/Security
 * Approved: 2026-04-10
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SecuritySignOff {
  approvedBy: string;
  approvedDate: string;
  version: number;
  status: 'approved';
  notes: string;
}

export type Permission =
  | 'sow:create' | 'sow:read' | 'sow:update' | 'sow:approve' | 'sow:delete'
  | 'resource_plan:create' | 'resource_plan:read' | 'resource_plan:update'
  | 'assignment:create' | 'assignment:read'
  | 'timesheet:read' | 'timesheet:approve'
  | 'burnt_report:read' | 'burnt_report:export'
  | 'change_order:create' | 'change_order:read' | 'change_order:approve'
  | 'capacity:read'
  | 'customer:read' | 'customer:manage'
  | 'employee:read' | 'employee:manage'
  | 'flc:read'
  | 'margin:read'
  | 'admin:manage_users' | 'admin:manage_roles' | 'admin:system_config';

export interface AppRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RowLevelSecurityRule {
  entity: string;
  rule: string;
  description: string;
}

export interface OAuthConfig {
  provider: string;
  protocol: string;
  grantType: string;
  tokenEndpoint: string;
  authorizationEndpoint: string;
  scopes: string[];
  tokenLifetime: string;
  refreshTokenLifetime: string;
}

export interface JWTConfig {
  algorithm: string;
  issuer: string;
  audience: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  claims: string[];
}

export interface DataResidencyConfig {
  primaryRegion: string;
  backupRegion: string;
  piiFields: string[];
  encryptionAtRest: string;
  encryptionInTransit: string;
}

// ─── Sign-Off ──────────────────────────────────────────────────────────────────

export const SECURITY_SIGN_OFF: SecuritySignOff = {
  approvedBy: 'it-security@dynpro.com',
  approvedDate: '2026-04-10',
  version: 1,
  status: 'approved',
  notes: 'OAuth 2.0 with Azure AD (or AWS Cognito) as identity provider. JWT for API auth. RBAC with row-level security for multi-tenant data isolation. FLC data classified as restricted.',
};

// ─── OAuth 2.0 Configuration ───────────────────────────────────────────────────

export const OAUTH_CONFIG: OAuthConfig = {
  provider: 'Azure AD', // or AWS Cognito — pending infrastructure decision
  protocol: 'OAuth 2.0 / OpenID Connect',
  grantType: 'Authorization Code with PKCE',
  tokenEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
  authorizationEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
  scopes: ['openid', 'profile', 'email', 'api://project-clarity/access'],
  tokenLifetime: '1 hour',
  refreshTokenLifetime: '24 hours',
};

// ─── JWT Configuration ─────────────────────────────────────────────────────────

export const JWT_CONFIG: JWTConfig = {
  algorithm: 'RS256',
  issuer: 'https://project-clarity.dynpro.com',
  audience: 'api://project-clarity',
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '24h',
  claims: [
    'sub',          // user ID
    'email',        // user email
    'name',         // display name
    'role',         // app role ID
    'permissions',  // array of permissions
    'bu_practice',  // business unit for row-level filtering
    'location',     // location for row-level filtering
  ],
};

// ─── Role-Based Access Control ─────────────────────────────────────────────────

export const APP_ROLES: AppRole[] = [
  {
    id: 'ROLE-ADMIN',
    name: 'System Administrator',
    description: 'Full system access. IT team only.',
    permissions: [
      'sow:create', 'sow:read', 'sow:update', 'sow:approve', 'sow:delete',
      'resource_plan:create', 'resource_plan:read', 'resource_plan:update',
      'assignment:create', 'assignment:read',
      'timesheet:read', 'timesheet:approve',
      'burnt_report:read', 'burnt_report:export',
      'change_order:create', 'change_order:read', 'change_order:approve',
      'capacity:read',
      'customer:read', 'customer:manage',
      'employee:read', 'employee:manage',
      'flc:read', 'margin:read',
      'admin:manage_users', 'admin:manage_roles', 'admin:system_config',
    ],
  },
  {
    id: 'ROLE-FINANCE-HEAD',
    name: 'Finance Head',
    description: 'SOW creation, pricing, full financial visibility. Maps to: Sharath.',
    permissions: [
      'sow:create', 'sow:read', 'sow:update',
      'resource_plan:create', 'resource_plan:read', 'resource_plan:update',
      'assignment:read',
      'burnt_report:read', 'burnt_report:export',
      'change_order:read',
      'capacity:read',
      'customer:read',
      'employee:read',
      'flc:read', 'margin:read',
    ],
  },
  {
    id: 'ROLE-FINANCE-OPS',
    name: 'Finance/Operations',
    description: 'SOW approval, financial reporting, margin oversight. Maps to: Madhup, Aishwarya.',
    permissions: [
      'sow:read', 'sow:approve',
      'resource_plan:read',
      'assignment:read',
      'timesheet:read', 'timesheet:approve',
      'burnt_report:read', 'burnt_report:export',
      'change_order:read', 'change_order:approve',
      'capacity:read',
      'customer:read',
      'employee:read',
      'flc:read', 'margin:read',
    ],
  },
  {
    id: 'ROLE-PM',
    name: 'Project Manager',
    description: 'Resource planning, assignments, change orders. Maps to: Sharad.',
    permissions: [
      'sow:read',
      'resource_plan:create', 'resource_plan:read', 'resource_plan:update',
      'assignment:create', 'assignment:read',
      'timesheet:read', 'timesheet:approve',
      'burnt_report:read',
      'change_order:create', 'change_order:read',
      'capacity:read',
      'customer:read',
      'employee:read',
      'margin:read',
      // Note: NO 'flc:read' — PMs see margin % but not the underlying FLC
    ],
  },
  {
    id: 'ROLE-EXEC',
    name: 'Executive Leadership',
    description: 'Dashboard access, low-margin SOW approval. Maps to: Shiv, BU Head, CRO.',
    permissions: [
      'sow:read', 'sow:approve',
      'resource_plan:read',
      'assignment:read',
      'burnt_report:read', 'burnt_report:export',
      'change_order:read', 'change_order:approve',
      'capacity:read',
      'customer:read',
      'employee:read',
      'flc:read', 'margin:read',
    ],
  },
  {
    id: 'ROLE-BACK-OFFICE',
    name: 'Back Office',
    description: 'Assignment visibility, timesheet processing. Maps to: Ash, Ankit, HR, Naveen.',
    permissions: [
      'assignment:read',
      'timesheet:read',
      'employee:read',
      'customer:read',
    ],
  },
  {
    id: 'ROLE-SALES',
    name: 'Sales',
    description: 'Customer and opportunity visibility. No FLC or margin access.',
    permissions: [
      'sow:read',
      'customer:read',
      'capacity:read',
      // Note: NO 'flc:read', NO 'margin:read' — prevents cost-focused negotiation
    ],
  },
  {
    id: 'ROLE-EMPLOYEE',
    name: 'Employee',
    description: 'Own timesheet and assignment visibility only.',
    permissions: [
      'timesheet:read',   // own timesheets only (row-level)
      'assignment:read',  // own assignments only (row-level)
    ],
  },
];

// ─── Row-Level Security Rules ──────────────────────────────────────────────────

export const ROW_LEVEL_SECURITY: RowLevelSecurityRule[] = [
  {
    entity: 'timesheets',
    rule: 'Employees can only view/edit their own timesheets. PMs can view timesheets for resources on their projects. Finance/Exec can view all.',
    description: 'Filter by resource_id = current_user.resource_id for Employee role. Filter by project membership for PM role.',
  },
  {
    entity: 'assignments',
    rule: 'Employees see only their own assignments. PMs see assignments for their projects. Back Office sees all.',
    description: 'Filter by resource_id or project_id based on role.',
  },
  {
    entity: 'sows',
    rule: 'Sales sees SOWs for their accounts only. Finance/PM/Exec sees all. Employees cannot access SOWs.',
    description: 'Filter by customer_id for Sales role. Block for Employee role.',
  },
  {
    entity: 'flc_data',
    rule: 'Only Finance Head, Finance Ops, Executive, and Admin roles can access FLC data. All others are blocked.',
    description: 'Permission check on flc:read. API must never return FLC in responses to unauthorized roles.',
  },
  {
    entity: 'resource_allocations',
    rule: 'Employees see their own allocation. PMs see allocations for their projects. Capacity dashboard aggregates visible to PM+ roles.',
    description: 'Filter by resource_id for Employee role. Aggregate views permitted for PM and above.',
  },
];

// ─── Data Residency ────────────────────────────────────────────────────────────

export const DATA_RESIDENCY: DataResidencyConfig = {
  primaryRegion: 'us-east-1', // pending AWS vs Azure decision
  backupRegion: 'us-west-2',
  piiFields: [
    'employee.email',
    'employee.name',
    'employee.flc_per_hour',
    'customer.primary_contact_email',
    'customer.primary_contact_name',
  ],
  encryptionAtRest: 'AES-256',
  encryptionInTransit: 'TLS 1.3',
};

// ─── Mock User for Development ─────────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  resourceId: string | null;
  buPractice: string;
  location: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: 'U001', email: 'sharath@dynpro.com', name: 'Sharath', roleId: 'ROLE-FINANCE-HEAD', resourceId: null, buPractice: 'Finance', location: 'US' },
  { id: 'U002', email: 'sharad@dynpro.com', name: 'Sharad', roleId: 'ROLE-PM', resourceId: 'R004', buPractice: 'Delivery', location: 'US' },
  { id: 'U003', email: 'madhup@dynpro.com', name: 'Madhup', roleId: 'ROLE-FINANCE-OPS', resourceId: null, buPractice: 'Finance', location: 'US' },
  { id: 'U004', email: 'aishwarya@dynpro.com', name: 'Aishwarya', roleId: 'ROLE-FINANCE-OPS', resourceId: null, buPractice: 'Finance', location: 'India' },
  { id: 'U005', email: 'shiv@dynpro.com', name: 'Shiv', roleId: 'ROLE-EXEC', resourceId: null, buPractice: 'Executive', location: 'US' },
  { id: 'U006', email: 'bu-head@dynpro.com', name: 'BU Head', roleId: 'ROLE-EXEC', resourceId: null, buPractice: 'Executive', location: 'US' },
  { id: 'U007', email: 'ash@dynpro.com', name: 'Ash', roleId: 'ROLE-BACK-OFFICE', resourceId: null, buPractice: 'Operations', location: 'India' },
  { id: 'U008', email: 'romy.sharma@dynpro.com', name: 'Romy Sharma', roleId: 'ROLE-EMPLOYEE', resourceId: 'R001', buPractice: 'Engineering', location: 'India-Pune' },
  { id: 'U009', email: 'alex.chen@dynpro.com', name: 'Alex Chen', roleId: 'ROLE-EMPLOYEE', resourceId: 'R002', buPractice: 'Engineering', location: 'US' },
  { id: 'U010', email: 'admin@dynpro.com', name: 'System Admin', roleId: 'ROLE-ADMIN', resourceId: null, buPractice: 'IT', location: 'US' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getRoleById(roleId: string): AppRole | undefined {
  return APP_ROLES.find((r) => r.id === roleId);
}

export function hasPermission(roleId: string, permission: Permission): boolean {
  const role = getRoleById(roleId);
  return role?.permissions.includes(permission) ?? false;
}

export function getUserPermissions(userId: string): Permission[] {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return [];
  const role = getRoleById(user.roleId);
  return role?.permissions ?? [];
}

export function getMockUserByEmail(email: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.email === email);
}
