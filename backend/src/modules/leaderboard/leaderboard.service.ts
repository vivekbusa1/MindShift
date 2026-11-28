import { leaderboardRepository, LocationFilter } from './leaderboard.repository';
import { prisma } from '../../config/database';

export type LeaderboardScope = 'global' | 'city' | 'state' | 'country';

function getPeriodKey(period: string): string {
  const now = new Date();
  if (period === 'daily') return now.toISOString().slice(0, 10);
  if (period === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // weekly: ISO week
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function resolveScopeFilter(
  userId: string,
  scope: LeaderboardScope
): Promise<{
  filter?: LocationFilter;
  locationValue: string | null;
  missingLocation: boolean;
}> {
  if (scope === 'global') {
    return { locationValue: null, missingLocation: false };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { city: true, state: true, country: true },
  });

  const value = profile?.[scope]?.trim() ?? '';
  if (!value) {
    return { locationValue: null, missingLocation: true };
  }

  return {
    filter: { [scope]: value },
    locationValue: value,
    missingLocation: false,
  };
}

export const leaderboardService = {
  async getLeaderboard(
    userId: string,
    period: string,
    scope: LeaderboardScope = 'global'
  ) {
    const periodKey = getPeriodKey(period);
    const { filter, locationValue, missingLocation } = await resolveScopeFilter(userId, scope);

    if (missingLocation) {
      return {
        entries: [],
        scope,
        locationValue: null,
        missingLocation: true,
      };
    }

    const entries = await leaderboardRepository.getLeaderboard(period, periodKey, filter);
    return {
      entries: entries.map((e, idx) => ({
        rank: idx + 1,
        userId: e.userId,
        name: e.user.profile?.nickname ?? e.user.profile?.fullName ?? 'User',
        avatarUrl: e.user.profile?.avatarUrl ?? null,
        city: e.user.profile?.city ?? null,
        state: e.user.profile?.state ?? null,
        country: e.user.profile?.country ?? null,
        score: Math.round(e.score),
      })),
      scope,
      locationValue,
      missingLocation: false,
    };
  },

  async getMyRank(
    userId: string,
    period: string,
    scope: LeaderboardScope = 'global'
  ) {
    const periodKey = getPeriodKey(period);
    const { filter, locationValue, missingLocation } = await resolveScopeFilter(userId, scope);

    if (missingLocation) {
      return {
        userId,
        rank: null,
        score: 0,
        period,
        periodKey,
        scope,
        locationValue: null,
        missingLocation: true,
      };
    }

    const entries = await leaderboardRepository.getLeaderboard(period, periodKey, filter, 500);
    const index = entries.findIndex((e) => e.userId === userId);
    if (index === -1) {
      return {
        userId,
        rank: null,
        score: 0,
        period,
        periodKey,
        scope,
        locationValue,
        missingLocation: false,
      };
    }

    return {
      userId,
      rank: index + 1,
      score: Math.round(entries[index].score),
      period,
      periodKey,
      scope,
      locationValue,
      missingLocation: false,
    };
  },

  async syncUserScore(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const score = await prisma.dailyScore.findUnique({
      where: { userId_dateKey: { userId, dateKey: today } },
    });
    if (!score) return;

    const periods = ['daily', 'weekly', 'monthly'];
    await Promise.all(
      periods.map((p) => leaderboardRepository.upsertEntry(userId, p, getPeriodKey(p), score.totalScore))
    );
  },
};
