import { z } from 'zod';

export const createSOWSchema = z.object({
  templateId: z.string().min(1),
  customerId: z.string().min(1),
  title: z.string().min(1).max(300),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const updateSOWSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
});

export const resourceLineSchema = z.object({
  roleId: z.string().min(1),
  locationId: z.string().min(1),
  resourceId: z.string().optional(),
  hours: z.number().positive(),
  billRate: z.number().positive(),
});

export const calculateMarginSchema = z.object({
  resourceLines: z.array(resourceLineSchema).min(1),
});

export const approveSchema = z.object({
  comments: z.string().optional(),
});

export const rejectSchema = z.object({
  comments: z.string().min(1, 'Comments are required when rejecting'),
});
