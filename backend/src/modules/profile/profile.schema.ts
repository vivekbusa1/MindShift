import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  nickname: z.string().optional(),
  ageGroup: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  profession: z.string().optional(),
  customProfession: z.string().optional(),
  workload: z.string().optional(),
  preferredRoutine: z.string().optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notificationsEnabled: z.boolean().optional(),
  reminderTime: z.string().optional().nullable(),
  privacyMode: z.boolean().optional(),
  language: z.string().optional(),
});
