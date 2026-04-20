import type { Request, Response, NextFunction } from 'express';
import { forbidden } from '../lib/AppError.js';
import type { Permission } from '../services/authConfig.js';

/**
 * Middleware that checks if the authenticated user has the required permission.
 * Must be used after verifyJWT middleware.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw forbidden('No authenticated user');
    }

    const hasAll = permissions.every((p) => user.permissions.includes(p));
    if (!hasAll) {
      throw forbidden(`Missing required permission: ${permissions.join(', ')}`);
    }

    next();
  };
}
