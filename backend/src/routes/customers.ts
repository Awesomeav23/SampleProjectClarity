import { Router } from 'express';
import { db } from '../lib/db.js';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/customers
 * List all customers. Optional ?status=active filter.
 */
router.get(
  '/',
  requirePermission('customer:read'),
  asyncHandler(async (req, res) => {
    let query = db('customers').select('*').orderBy('name');
    if (req.query.status) {
      query = query.where('status', req.query.status as string);
    }
    const customers = await query;
    res.json(customers);
  })
);

/**
 * GET /api/customers/:id
 * Single customer with MSA info.
 */
router.get(
  '/:id',
  requirePermission('customer:read'),
  asyncHandler(async (req, res) => {
    const customer = await db('customers').where('id', req.params.id).first();
    if (!customer) throw notFound(`Customer ${req.params.id} not found`);

    const msa = await db('msas').where('customer_id', req.params.id).first();

    res.json({ ...customer, msa: msa ?? null });
  })
);

export default router;
