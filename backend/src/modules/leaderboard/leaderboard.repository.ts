import { prisma } from '../../config/database';

export const leaderboardRepository = {
  async getLeaderboard(period: string, periodKey: string, limit = 50) {
    return prisma.leaderboardEntry.findMany({
      where: { period, periodKey },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          include: { profile: { select: { fullName: true, nickname: true, avatarUrl: true } } },
        },
      },
    });
  },

  async getMyEntry(userId: string, period: string, periodKey: string) {
    return prisma.leaderboardEntry.findUnique({
      where: { userId_period_periodKey: { userId, period, periodKey } },
    });
  },

  async upsertEntry(userId: string, period: string, periodKey: string, score: number) {
    return prisma.leaderboardEntry.upsert({
      where: { userId_period_periodKey: { userId, period, periodKey } },
      create: { userId, period, periodKey, score },
      update: { score },
    });
  },

  async refreshRanks(period: string, periodKey: string) {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { period, periodKey },
      orderBy: { score: 'desc' },
    });
    await Promise.all(
      entries.map((e, idx) =>
        prisma.leaderboardEntry.update({ where: { id: e.id }, data: { rank: idx + 1 } })
      )
    );
  },
};
