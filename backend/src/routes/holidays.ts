import { Router } from 'express';
import { db } from '../lib/db.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/holidays
 * List holidays. Optional filters: ?locationId=LOC-US, ?customerId=C001, ?year=2026
 */
router.get(
  '/',
  requirePermission('employee:read'),
  asyncHandler(async (req, res) => {
    let query = db('holidays')
      .select('holidays.*', 'locations.name as location_name')
      .join('locations', 'holidays.location_id', 'locations.id')
      .orderBy('holidays.date');

    if (req.query.locationId) {
      query = query.where('holidays.location_id', req.query.locationId as string);
    }
    if (req.query.customerId) {
      query = query.where((builder) => {
        builder.whereNull('holidays.customer_id').orWhere('holidays.customer_id', req.query.customerId as string);
      });
    } else {
      // By default only return global holidays (not customer-specific)
      query = query.whereNull('holidays.customer_id');
    }
    if (req.query.year) {
      const year = req.query.year as string;
      query = query.whereBetween('holidays.date', [`${year}-01-01`, `${year}-12-31`]);
    }

    const holidays = await query;
    res.json(holidays);
  })
);

export default router;
