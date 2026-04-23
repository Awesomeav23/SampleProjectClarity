import { Router } from 'express';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { services } from '../services/index.js';
import { SHAREPOINT_FOLDERS } from '../services/sharepointClient.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/sharepoint/folders
 * List folders. Optional ?parent=/PMO/ProjectClarity to list sub-folders only.
 */
router.get(
  '/folders',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const parent = req.query.parent as string | undefined;
    const folders = await services.sharepoint.listFolders(parent);
    res.json({ root: SHAREPOINT_FOLDERS.ROOT, folders });
  })
);

/**
 * GET /api/sharepoint/documents
 * List documents in a folder. Requires ?folderPath=/PMO/ProjectClarity/SOWs
 */
router.get(
  '/documents',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const folderPath = req.query.folderPath as string | undefined;
    if (!folderPath) throw notFound('folderPath query parameter required');
    const docs = await services.sharepoint.listDocuments(folderPath);
    res.json(docs);
  })
);

/**
 * GET /api/sharepoint/documents/:id
 * Get a single document's metadata.
 */
router.get(
  '/documents/:id',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const doc = await services.sharepoint.getDocument(req.params.id as string);
    if (!doc) throw notFound(`Document ${req.params.id} not found`);
    res.json(doc);
  })
);

/**
 * GET /api/sharepoint/documents/:id/versions
 * Version history for a document.
 */
router.get(
  '/documents/:id/versions',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const doc = await services.sharepoint.getDocument(req.params.id as string);
    if (!doc) throw notFound(`Document ${req.params.id} not found`);
    const versions = await services.sharepoint.getDocumentVersions(req.params.id as string);
    res.json({ documentId: doc.id, name: doc.name, currentVersion: doc.version, versions });
  })
);

/**
 * GET /api/sharepoint/search
 * Metadata search. All query params (except reserved ones) become the match filter.
 * Example: /api/sharepoint/search?sowId=SOW-001
 *          /api/sharepoint/search?status=signed&type=elaborate_tm
 */
router.get(
  '/search',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const filter: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') filter[key] = value;
    }
    if (Object.keys(filter).length === 0) throw notFound('At least one metadata filter is required');
    const results = await services.sharepoint.searchDocuments(filter);
    res.json(results);
  })
);

export default router;
