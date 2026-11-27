import { z } from 'zod';

export const updateGoalsSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  bedTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  sleepDurationMin: z.number().int().min(60).max(720).optional(),
  workoutMin: z.number().int().min(0).max(300).optional(),
  studyWorkMin: z.number().int().min(0).max(900).optional(),
  customTargets: z.record(z.unknown()).optional(),
});
