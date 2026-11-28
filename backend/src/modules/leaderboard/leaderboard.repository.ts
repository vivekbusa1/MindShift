import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface LocationFilter {
  city?: string;
  state?: string;
  country?: string;
}

export const leaderboardRepository = {
  async getLeaderboard(
    period: string,
    periodKey: string,
    locationFilter?: LocationFilter,
    limit = 50
  ) {
    const profileWhere: Prisma.UserProfileWhereInput = {};
    if (locationFilter?.city) {
      profileWhere.city = { equals: locationFilter.city, mode: 'insensitive' };
    }
    if (locationFilter?.state) {
      profileWhere.state = { equals: locationFilter.state, mode: 'insensitive' };
    }
    if (locationFilter?.country) {
      profileWhere.country = { equals: locationFilter.country, mode: 'insensitive' };
    }

    const hasFilter = Object.keys(profileWhere).length > 0;

    return prisma.leaderboardEntry.findMany({
      where: {
        period,
        periodKey,
        ...(hasFilter ? { user: { profile: profileWhere } } : {}),
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          include: {
            profile: {
              select: {
                fullName: true,
                nickname: true,
                avatarUrl: true,
                city: true,
                state: true,
                country: true,
              },
            },
          },
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
