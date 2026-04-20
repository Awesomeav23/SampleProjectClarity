import { Router } from 'express';
import { db } from '../lib/db.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/roles
 * List all roles with standard rates by location.
 * FLC in rates only visible if user has flc:read permission.
 */
router.get(
  '/',
  requirePermission('employee:read'),
  asyncHandler(async (req, res) => {
    const canReadFlc = req.user!.permissions.includes('flc:read');

    const roles = await db('roles').select('*').orderBy('practice', 'title');

    const rates = await db('role_rates')
      .select('role_rates.*', 'locations.name as location_name')
      .join('locations', 'role_rates.location_id', 'locations.id');

    const rolesWithRates = roles.map((role) => {
      const roleRates = rates
        .filter((r) => r.role_id === role.id)
        .map((r) => {
          const rate: any = {
            locationId: r.location_id,
            locationName: r.location_name,
            billRate: parseFloat(r.bill_rate),
          };
          if (canReadFlc) rate.flc = parseFloat(r.flc);
          return rate;
        });
      return { ...role, standardRates: roleRates };
    });

    res.json(rolesWithRates);
  })
);

export default router;
