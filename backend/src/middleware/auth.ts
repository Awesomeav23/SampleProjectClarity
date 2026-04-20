import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized } from '../lib/AppError.js';
import type { Permission } from '../services/authConfig.js';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  roleId: string;
  permissions: Permission[];
  buPractice: string;
  location: string;
  resourceId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function verifyJWT(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Missing or invalid Authorization header');
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

export function signJWT(payload: Omit<AuthUser, 'iat' | 'exp'>): string {
  return jwt.sign(payload as object, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiry as any,
  });
}
