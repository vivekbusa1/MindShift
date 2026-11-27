import { z } from 'zod';

export const createActivitySchema = z.object({
  name: z.string().min(1),
  category: z.enum(['sleep', 'fitness', 'productivity', 'nutrition', 'mindfulness', 'custom']),
  icon: z.string().optional(),
  unit: z.string().optional(),
  aliases: z.array(z.string()).optional().default([]),
  scoreWeight: z.number().min(0).max(5).optional().default(1.0),
});

export const logActivitySchema = z.object({
  activityId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  durationMin: z.number().int().min(1).optional().nullable(),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  source: z.enum(['manual', 'parsed', 'late_entry']).optional().default('manual'),
  isLateEntry: z.boolean().optional().default(false),
  rawMessage: z.string().optional().nullable(),
});

export const parseMessageSchema = z.object({
  message: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getLogsQuerySchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().optional(),
});
