/**
 * Service Provider
 *
 * Exports service clients based on MOCK_MODE.
 * When MOCK_MODE=true (default), all services use in-memory mock data.
 * When MOCK_MODE=false, services expect real credentials in .env.
 *
 * Usage:
 *   import { services } from '../services/index.js';
 *   const customers = await services.jobdiva.getCustomers();
 */

import { config } from '../config.js';

// Mock implementations
import * as mockJobDiva from './jobdivaClient.js';
import * as mockDocuSign from './docusignClient.js';
import * as mockSharePoint from './sharepointClient.js';

// ─── Service Interfaces ────────────────────────────────────────────────────────
// These define the contract. Mock clients already satisfy them.
// Real clients must implement the same shape.

export interface JobDivaService {
  createJobDivaAssignment: typeof mockJobDiva.createJobDivaAssignment;
  getCustomers: typeof mockJobDiva.getCustomers;
  getCustomerById: typeof mockJobDiva.getCustomerById;
  getEmployees: typeof mockJobDiva.getEmployees;
  getEmployeeById: typeof mockJobDiva.getEmployeeById;
  getEmployeesByLocation: typeof mockJobDiva.getEmployeesByLocation;
  getOpportunities: typeof mockJobDiva.getOpportunities;
  getOpportunitiesByCustomer: typeof mockJobDiva.getOpportunitiesByCustomer;
  getMSAs: typeof mockJobDiva.getMSAs;
  getMSAByCustomer: typeof mockJobDiva.getMSAByCustomer;
  getMSAById: typeof mockJobDiva.getMSAById;
  getTimesheets: typeof mockJobDiva.getTimesheets;
  getTimesheetsByWeek: typeof mockJobDiva.getTimesheetsByWeek;
  getResourceAllocations: typeof mockJobDiva.getResourceAllocations;
  updateResourceAllocation: typeof mockJobDiva.updateResourceAllocation;
}

export interface DocuSignService {
  createEnvelope: typeof mockDocuSign.createEnvelope;
  getEnvelopeStatus: typeof mockDocuSign.getEnvelopeStatus;
  simulateSignerAction: typeof mockDocuSign.simulateSignerAction;
  voidEnvelope: typeof mockDocuSign.voidEnvelope;
  listEnvelopes: typeof mockDocuSign.listEnvelopes;
}

export interface SharePointService {
  uploadDocument: typeof mockSharePoint.uploadDocument;
  getDocument: typeof mockSharePoint.getDocument;
  listDocuments: typeof mockSharePoint.listDocuments;
  searchDocuments: typeof mockSharePoint.searchDocuments;
  getDocumentVersions: typeof mockSharePoint.getDocumentVersions;
  createFolder: typeof mockSharePoint.createFolder;
  listFolders: typeof mockSharePoint.listFolders;
}

export interface Services {
  jobdiva: JobDivaService;
  docusign: DocuSignService;
  sharepoint: SharePointService;
}

// ─── Build Services ────────────────────────────────────────────────────────────

function createServices(): Services {
  if (config.mockMode) {
    console.log('[CONFIG] Running in MOCK MODE — all services use in-memory data');
    return {
      jobdiva: mockJobDiva,
      docusign: mockDocuSign,
      sharepoint: mockSharePoint,
    };
  }

  // Real mode — check that credentials are present
  const missing: string[] = [];

  if (!config.jobdiva.clientId) missing.push('JOBDIVA_CLIENT_ID');
  if (!config.jobdiva.clientSecret) missing.push('JOBDIVA_CLIENT_SECRET');
  if (!config.docusign.integrationKey) missing.push('DOCUSIGN_INTEGRATION_KEY');
  if (!config.docusign.accountId) missing.push('DOCUSIGN_ACCOUNT_ID');
  if (!config.sharepoint.clientId) missing.push('SHAREPOINT_CLIENT_ID');
  if (!config.sharepoint.tenantId) missing.push('SHAREPOINT_TENANT_ID');

  if (missing.length > 0) {
    console.error(
      `[CONFIG] MOCK_MODE=false but missing credentials: ${missing.join(', ')}\n` +
      `         Set MOCK_MODE=true or provide the missing values in .env`
    );
    process.exit(1);
  }

  // TODO: Replace with real client implementations when available
  //   import * as realJobDiva from './jobdivaRealClient.js';
  //   import * as realDocuSign from './docusignRealClient.js';
  //   import * as realSharePoint from './sharepointRealClient.js';
  console.warn(
    '[CONFIG] MOCK_MODE=false — real client implementations not yet available, falling back to mock'
  );
  return {
    jobdiva: mockJobDiva,
    docusign: mockDocuSign,
    sharepoint: mockSharePoint,
  };
}

export const services: Services = createServices();
