import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';
import { AppError } from '../lib/AppError.js';

/**
 * Validates request body against a Zod schema.
 * Parsed data is placed on req.body (replacing the raw input).
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, `Validation error: ${JSON.stringify(result.error)}`);
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates request query params against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new AppError(400, `Query validation error: ${JSON.stringify(result.error)}`);
    }
    req.query = result.data as any;
    next();
  };
}
