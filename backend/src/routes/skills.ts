import { Router } from 'express';
import { db } from '../lib/db.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/skills
 * List all skills in hierarchy: practice > sub_practice > competency > skill.
 * Optional ?practice=Engineering filter.
 */
router.get(
  '/',
  requirePermission('employee:read'),
  asyncHandler(async (req, res) => {
    let query = db('skills').select('*').orderBy('practice').orderBy('sub_practice').orderBy('competency').orderBy('name');
    if (req.query.practice) {
      query = query.where('practice', req.query.practice as string);
    }
    const skills = await query;
    res.json(skills);
  })
);

export default router;
