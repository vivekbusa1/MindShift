import { prisma } from '../../config/database';

export const streaksRepository = {
  async findByUserId(userId: string) {
    return prisma.userStreak.findUnique({ where: { userId } });
  },

  async upsert(userId: string, data: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    milestones: number[];
  }) {
    return prisma.userStreak.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  async getShields(userId: string) {
    return prisma.shield.findMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  },

  async useShield(shieldId: string, userId: string) {
    const shield = await prisma.shield.findUnique({ where: { id: shieldId } });
    if (!shield || shield.userId !== userId) throw { code: 'NOT_FOUND', message: 'Shield not found' };
    if (shield.usedAt) throw { code: 'CONFLICT', message: 'Shield already used' };
    return prisma.shield.update({ where: { id: shieldId }, data: { usedAt: new Date() } });
  },

  async awardShield(userId: string, reason: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return prisma.shield.create({ data: { userId, reason, expiresAt } });
  },

  async getCalendar(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return prisma.dailyScore.findMany({
      where: { userId, dateKey: { gte: startDate, lte: endDate } },
      select: { dateKey: true, totalScore: true },
      orderBy: { dateKey: 'asc' },
    });
  },
};
