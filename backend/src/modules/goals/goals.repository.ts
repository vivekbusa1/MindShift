import { prisma } from '../../config/database';

export const goalsRepository = {
  async findByUserId(userId: string) {
    return prisma.userGoal.findUnique({ where: { userId } });
  },
  async upsert(userId: string, data: Record<string, unknown>) {
    return prisma.userGoal.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
