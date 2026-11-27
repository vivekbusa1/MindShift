import { z } from 'zod';

export const logSleepSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().datetime(),
  wakeTime: z.string().datetime().optional().nullable(),
  quality: z.enum(['good', 'fair', 'poor']).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateSleepSchema = logSleepSchema.partial();
