import { z } from 'zod';

const lineSchema = z.object({
  resourceId: z.string().optional(),
  roleId: z.string().optional(),
  hours: z.number().positive(),
  billRate: z.number().positive(),
});

export const createChangeOrderSchema = z.object({
  sowId: z.string().min(1),
  type: z.enum(['timeline', 'resource', 'scope']),
  description: z.string().min(1),
  additions: z.array(lineSchema).default([]),
  credits: z.array(lineSchema).default([]),
});

export const approveChangeOrderSchema = z.object({
  comments: z.string().optional(),
});

export const rejectChangeOrderSchema = z.object({
  comments: z.string().min(1, 'Comments are required when rejecting'),
});
