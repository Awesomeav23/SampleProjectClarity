import { z } from 'zod';

export const createAssignmentSchema = z.object({
  resourceId: z.string().min(1),
  projectId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  allocationPercent: z.number().int().min(1).max(200),
  billRate: z.number().positive(),
  approverEmail: z.string().email(),
  notes: z.string().optional(),
});
