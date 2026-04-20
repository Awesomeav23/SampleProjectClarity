/**
 * SharePoint Online Mock Client
 *
 * Simulates SharePoint REST API / Microsoft Graph API for document management.
 * Swap with real Graph SDK when app registration and permissions are available.
 *
 * Capabilities:
 *   - Upload SOW documents with metadata
 *   - Folder structure: PMO/Project Clarity/[SOWs|ResourcePlans|Documentation]
 *   - Document versioning
 *   - Metadata tagging for search
 *   - Download / retrieve document info
 */

import { nanoid } from 'nanoid';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SharePointDocument {
  id: string;
  name: string;
  folderPath: string;
  fullUrl: string;
  mimeType: string;
  sizeBytes: number;
  metadata: Record<string, string>;
  version: number;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  versions: DocumentVersion[];
}

export interface DocumentVersion {
  versionNumber: number;
  modifiedBy: string;
  modifiedAt: string;
  comment: string;
  sizeBytes: number;
}

export interface UploadDocumentInput {
  fileName: string;
  folderPath: string; // e.g., '/PMO/ProjectClarity/SOWs'
  content: Buffer | string; // file content (in mock, we just store size)
  metadata?: Record<string, string>;
  createdBy: string;
  comment?: string;
}

export interface CreateFolderInput {
  folderPath: string;
  name: string;
}

// ─── Folder Structure Constants ────────────────────────────────────────────────

export const SHAREPOINT_FOLDERS = {
  ROOT: '/PMO/ProjectClarity',
  SOWS: '/PMO/ProjectClarity/SOWs',
  RESOURCE_PLANS: '/PMO/ProjectClarity/ResourcePlans',
  DOCUMENTATION: '/PMO/ProjectClarity/Documentation',
  CHANGE_ORDERS: '/PMO/ProjectClarity/ChangeOrders',
  TEMPLATES: '/PMO/ProjectClarity/Templates',
  SIGNED: '/PMO/ProjectClarity/SOWs/Signed',
} as const;

// ─── In-Memory Store ───────────────────────────────────────────────────────────

const documents = new Map<string, SharePointDocument>();
const folders = new Set<string>(Object.values(SHAREPOINT_FOLDERS));

// Pre-populate with existing SOW documents referenced in mock data
function initializeMockDocuments() {
  const mockDocs: Omit<SharePointDocument, 'id' | 'versions'>[] = [
    {
      name: 'SOW-001-SurveyMonkey.pdf', folderPath: SHAREPOINT_FOLDERS.SIGNED,
      fullUrl: `${SHAREPOINT_FOLDERS.SIGNED}/SOW-001-SurveyMonkey.pdf`,
      mimeType: 'application/pdf', sizeBytes: 245_000,
      metadata: { sowId: 'SOW-001', customerId: 'C001', customerName: 'SurveyMonkey', status: 'signed', type: 'elaborate_tm' },
      version: 2, createdBy: 'sharath@dynpro.com', createdAt: '2026-01-08T10:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-01-10T14:30:00Z',
    },
    {
      name: 'SOW-002-AcmeCRM.pdf', folderPath: SHAREPOINT_FOLDERS.SIGNED,
      fullUrl: `${SHAREPOINT_FOLDERS.SIGNED}/SOW-002-AcmeCRM.pdf`,
      mimeType: 'application/pdf', sizeBytes: 312_000,
      metadata: { sowId: 'SOW-002', customerId: 'C002', customerName: 'Acme Corp', status: 'signed', type: 'fixed_fee' },
      version: 1, createdBy: 'sharath@dynpro.com', createdAt: '2026-01-25T09:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-01-28T11:00:00Z',
    },
    {
      name: 'SOW-003-Globex.pdf', folderPath: SHAREPOINT_FOLDERS.SIGNED,
      fullUrl: `${SHAREPOINT_FOLDERS.SIGNED}/SOW-003-Globex.pdf`,
      mimeType: 'application/pdf', sizeBytes: 198_000,
      metadata: { sowId: 'SOW-003', customerId: 'C003', customerName: 'Globex', status: 'signed', type: 'lean_tm' },
      version: 1, createdBy: 'sharath@dynpro.com', createdAt: '2026-02-22T10:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-02-25T15:00:00Z',
    },
    {
      name: 'SOW-004-TechCorp.pdf', folderPath: SHAREPOINT_FOLDERS.SIGNED,
      fullUrl: `${SHAREPOINT_FOLDERS.SIGNED}/SOW-004-TechCorp.pdf`,
      mimeType: 'application/pdf', sizeBytes: 278_000,
      metadata: { sowId: 'SOW-004', customerId: 'C004', customerName: 'TechCorp Solutions', status: 'signed', type: 'elaborate_tm' },
      version: 3, createdBy: 'sharath@dynpro.com', createdAt: '2026-03-20T08:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-03-28T16:00:00Z',
    },
    {
      name: 'SOW-005-RetailMax.pdf', folderPath: SHAREPOINT_FOLDERS.SIGNED,
      fullUrl: `${SHAREPOINT_FOLDERS.SIGNED}/SOW-005-RetailMax.pdf`,
      mimeType: 'application/pdf', sizeBytes: 165_000,
      metadata: { sowId: 'SOW-005', customerId: 'C006', customerName: 'RetailMax', status: 'signed', type: 'lean_tm' },
      version: 1, createdBy: 'sharath@dynpro.com', createdAt: '2026-03-10T11:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-03-12T09:30:00Z',
    },
    {
      name: 'CO-001-SurveyMonkey-Timeline-Extension.pdf', folderPath: SHAREPOINT_FOLDERS.CHANGE_ORDERS,
      fullUrl: `${SHAREPOINT_FOLDERS.CHANGE_ORDERS}/CO-001-SurveyMonkey-Timeline-Extension.pdf`,
      mimeType: 'application/pdf', sizeBytes: 89_000,
      metadata: { changeOrderId: 'CO-001', sowId: 'SOW-001', customerId: 'C001', type: 'timeline' },
      version: 1, createdBy: 'sharad@dynpro.com', createdAt: '2026-03-20T14:00:00Z',
      modifiedBy: 'sharad@dynpro.com', modifiedAt: '2026-03-22T10:00:00Z',
    },
    {
      name: 'SOW-Template-LeanTM.docx', folderPath: SHAREPOINT_FOLDERS.TEMPLATES,
      fullUrl: `${SHAREPOINT_FOLDERS.TEMPLATES}/SOW-Template-LeanTM.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 45_000,
      metadata: { templateType: 'lean_tm', status: 'approved' },
      version: 4, createdBy: 'sharath@dynpro.com', createdAt: '2025-06-15T10:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-01-05T09:00:00Z',
    },
    {
      name: 'SOW-Template-ElaborateTM.docx', folderPath: SHAREPOINT_FOLDERS.TEMPLATES,
      fullUrl: `${SHAREPOINT_FOLDERS.TEMPLATES}/SOW-Template-ElaborateTM.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 72_000,
      metadata: { templateType: 'elaborate_tm', status: 'approved' },
      version: 3, createdBy: 'sharath@dynpro.com', createdAt: '2025-06-15T10:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2025-12-20T14:00:00Z',
    },
    {
      name: 'SOW-Template-FixedFee.docx', folderPath: SHAREPOINT_FOLDERS.TEMPLATES,
      fullUrl: `${SHAREPOINT_FOLDERS.TEMPLATES}/SOW-Template-FixedFee.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 58_000,
      metadata: { templateType: 'fixed_fee', status: 'approved' },
      version: 2, createdBy: 'sharath@dynpro.com', createdAt: '2025-08-01T10:00:00Z',
      modifiedBy: 'sharath@dynpro.com', modifiedAt: '2026-02-10T11:00:00Z',
    },
  ];

  for (const doc of mockDocs) {
    const id = `SP-${nanoid(8).toUpperCase()}`;
    documents.set(id, {
      ...doc,
      id,
      versions: [
        {
          versionNumber: doc.version,
          modifiedBy: doc.modifiedBy,
          modifiedAt: doc.modifiedAt,
          comment: 'Current version',
          sizeBytes: doc.sizeBytes,
        },
      ],
    });
  }
}

initializeMockDocuments();

// ─── API Methods ───────────────────────────────────────────────────────────────

export async function uploadDocument(input: UploadDocumentInput): Promise<SharePointDocument> {
  await simulateLatency();

  // Check if document already exists (update = new version)
  const existing = Array.from(documents.values()).find(
    (d) => d.folderPath === input.folderPath && d.name === input.fileName
  );

  const now = new Date().toISOString();
  const contentSize = typeof input.content === 'string' ? input.content.length : input.content.length;

  if (existing) {
    existing.version += 1;
    existing.modifiedBy = input.createdBy;
    existing.modifiedAt = now;
    existing.sizeBytes = contentSize;
    if (input.metadata) {
      existing.metadata = { ...existing.metadata, ...input.metadata };
    }
    existing.versions.push({
      versionNumber: existing.version,
      modifiedBy: input.createdBy,
      modifiedAt: now,
      comment: input.comment ?? `Version ${existing.version}`,
      sizeBytes: contentSize,
    });
    console.log(`[SHAREPOINT MOCK] Updated ${existing.fullUrl} to v${existing.version}`);
    return existing;
  }

  const id = `SP-${nanoid(8).toUpperCase()}`;
  const fullUrl = `${input.folderPath}/${input.fileName}`;
  const ext = input.fileName.split('.').pop()?.toLowerCase();
  const mimeType =
    ext === 'pdf' ? 'application/pdf' :
    ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
    'application/octet-stream';

  const doc: SharePointDocument = {
    id,
    name: input.fileName,
    folderPath: input.folderPath,
    fullUrl,
    mimeType,
    sizeBytes: contentSize,
    metadata: input.metadata ?? {},
    version: 1,
    createdBy: input.createdBy,
    createdAt: now,
    modifiedBy: input.createdBy,
    modifiedAt: now,
    versions: [
      {
        versionNumber: 1,
        modifiedBy: input.createdBy,
        modifiedAt: now,
        comment: input.comment ?? 'Initial upload',
        sizeBytes: contentSize,
      },
    ],
  };

  documents.set(id, doc);
  console.log(`[SHAREPOINT MOCK] Uploaded ${fullUrl}`);
  return doc;
}

export async function getDocument(documentId: string): Promise<SharePointDocument | null> {
  await simulateLatency();
  return documents.get(documentId) ?? null;
}

export async function listDocuments(folderPath: string): Promise<SharePointDocument[]> {
  await simulateLatency();
  return Array.from(documents.values()).filter((d) => d.folderPath === folderPath);
}

export async function searchDocuments(
  query: Record<string, string>
): Promise<SharePointDocument[]> {
  await simulateLatency();
  return Array.from(documents.values()).filter((doc) =>
    Object.entries(query).every(([key, value]) => doc.metadata[key] === value)
  );
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  await simulateLatency();
  const doc = documents.get(documentId);
  return doc?.versions ?? [];
}

export async function createFolder(input: CreateFolderInput): Promise<{ success: boolean; path: string }> {
  await simulateLatency();
  const path = `${input.folderPath}/${input.name}`;
  folders.add(path);
  console.log(`[SHAREPOINT MOCK] Created folder: ${path}`);
  return { success: true, path };
}

export async function listFolders(parentPath?: string): Promise<string[]> {
  await simulateLatency();
  const allFolders = Array.from(folders);
  if (!parentPath) return allFolders;
  return allFolders.filter(
    (f) => f.startsWith(parentPath) && f !== parentPath && f.replace(parentPath + '/', '').indexOf('/') === -1
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function simulateLatency(): Promise<void> {
  const ms = 100 + Math.random() * 200;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
