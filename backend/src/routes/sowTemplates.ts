import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAllTemplates, getTemplateById } from '../services/sowTemplates.js';
import { notFound } from '../lib/AppError.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/sow-templates
 * List all SOW templates with summary info.
 */
router.get(
  '/',
  requirePermission('sow:read'),
  asyncHandler(async (_req, res) => {
    const templates = getAllTemplates();
    res.json(
      templates.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        description: t.description,
        version: t.version,
        sectionCount: t.sections.length,
        requiredFieldCount: t.requiredFields.length,
      }))
    );
  })
);

/**
 * GET /api/sow-templates/:id
 * Full template with all sections, fields, and approval rules.
 */
router.get(
  '/:id',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const template = getTemplateById(req.params.id as string);
    if (!template) throw notFound(`Template ${req.params.id as string} not found`);
    res.json(template);
  })
);

export default router;
