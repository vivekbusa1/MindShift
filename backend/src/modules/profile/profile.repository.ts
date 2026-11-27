import { prisma } from '../../config/database';

export const profileRepository = {
  async findByUserId(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } });
  },

  async upsert(userId: string, data: Record<string, unknown>) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, fullName: (data.fullName as string) ?? '', ...data },
      update: data,
    });
  },

  async findPreferences(userId: string) {
    return prisma.userPreferences.findUnique({ where: { userId } });
  },

  async upsertPreferences(userId: string, data: Record<string, unknown>) {
    return prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
