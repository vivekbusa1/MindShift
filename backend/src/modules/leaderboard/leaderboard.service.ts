import { leaderboardRepository } from './leaderboard.repository';
import { prisma } from '../../config/database';

function getPeriodKey(period: string): string {
  const now = new Date();
  if (period === 'daily') return now.toISOString().slice(0, 10);
  if (period === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // weekly: ISO week
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const leaderboardService = {
  async getLeaderboard(period: string) {
    const periodKey = getPeriodKey(period);
    const entries = await leaderboardRepository.getLeaderboard(period, periodKey);
    return entries.map((e, idx) => ({
      rank: idx + 1,
      userId: e.userId,
      name: e.user.profile?.nickname ?? e.user.profile?.fullName ?? 'User',
      avatarUrl: e.user.profile?.avatarUrl ?? null,
      score: Math.round(e.score),
    }));
  },

  async getMyRank(userId: string, period: string) {
    const periodKey = getPeriodKey(period);
    const entry = await leaderboardRepository.getMyEntry(userId, period, periodKey);
    if (!entry) return { userId, rank: null, score: 0, period, periodKey };
    return { userId, rank: entry.rank, score: Math.round(entry.score), period, periodKey };
  },

  async syncUserScore(userId: string) {
    // Pull today's score and push to all three period leaderboards
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
