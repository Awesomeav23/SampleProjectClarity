import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getResourceCapacities,
  getProjectCapacities,
  getPracticeCapacities,
  getCapacityAlerts,
} from '../services/capacityEngine.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/capacity
 * Capacity dashboard data. Query params:
 *   ?view=resource|project|practice (default: resource)
 *   ?weekStart=2026-04-13 (default: current week Monday)
 *   ?locationId=LOC-US (resource view filter)
 *   ?buPractice=Engineering (resource view filter)
 */
router.get(
  '/',
  requirePermission('capacity:read'),
  asyncHandler(async (req, res) => {
    const view = (req.query.view as string) ?? 'resource';
    const weekStart = (req.query.weekStart as string) ?? getMondayOfCurrentWeek();

    switch (view) {
      case 'project': {
        const data = await getProjectCapacities(weekStart);
        res.json({ view, weekStart, data });
        break;
      }
      case 'practice': {
        const data = await getPracticeCapacities(weekStart);
        res.json({ view, weekStart, data });
        break;
      }
      default: {
        const data = await getResourceCapacities(weekStart, {
          locationId: req.query.locationId as string | undefined,
          buPractice: req.query.buPractice as string | undefined,
        });
        res.json({ view: 'resource', weekStart, data });
        break;
      }
    }
  })
);

/**
 * GET /api/capacity/alerts
 * Over-allocated and under-utilized resource alerts.
 *   ?weekStart=2026-04-13
 */
router.get(
  '/alerts',
  requirePermission('capacity:read'),
  asyncHandler(async (req, res) => {
    const weekStart = (req.query.weekStart as string) ?? getMondayOfCurrentWeek();
    const alerts = await getCapacityAlerts(weekStart);
    res.json({ weekStart, ...alerts });
  })
);

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export default router;
