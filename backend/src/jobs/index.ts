import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { computeDailyScore } from '../modules/scoring/scoring.repository';
import { leaderboardRepository } from '../modules/leaderboard/leaderboard.repository';

export function registerJobs() {
  // ── Daily streak reset at 00:01 UTC ───────────────────────────────────────
  cron.schedule('1 0 * * *', async () => {
    logger.info('[Job] Running streak reset');
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

      // Users whose lastActiveDate is older than yesterday → reset streak
      const staleStreaks = await prisma.userStreak.findMany({
        where: {
          lastActiveDate: { lte: twoDaysAgo },
          currentStreak: { gt: 0 },
        },
      });

      for (const s of staleStreaks) {
        // Check for available shields
        const shield = await prisma.shield.findFirst({
          where: { userId: s.userId, usedAt: null, expiresAt: { gt: new Date() } },
        });
        if (shield) {
          await prisma.shield.update({ where: { id: shield.id }, data: { usedAt: new Date() } });
          await prisma.userStreak.update({
            where: { userId: s.userId },
            data: { lastActiveDate: yesterday },
          });
          logger.info(`[Job] Shield protected streak for user ${s.userId}`);
        } else {
          await prisma.userStreak.update({
            where: { userId: s.userId },
            data: { currentStreak: 0 },
          });
        }
      }
      logger.info(`[Job] Streak reset done. Processed ${staleStreaks.length} users`);
    } catch (err) {
      logger.error({ err }, '[Job] Streak reset failed');
    }
  });

  // ── Shield expiry at 00:05 UTC ────────────────────────────────────────────
  cron.schedule('5 0 * * *', async () => {
    logger.info('[Job] Cleaning expired shields');
    try {
      const { count } = await prisma.shield.deleteMany({
        where: { expiresAt: { lt: new Date() }, usedAt: null },
      });
      logger.info(`[Job] Deleted ${count} expired shields`);
    } catch (err) {
      logger.error({ err }, '[Job] Shield cleanup failed');
    }
  });

  // ── Score recalculation at 23:55 UTC ─────────────────────────────────────
  cron.schedule('55 23 * * *', async () => {
    logger.info('[Job] Recalculating daily scores');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const users = await prisma.user.findMany({ select: { id: true } });
      await Promise.allSettled(users.map((u) => computeDailyScore(u.id, today)));
      logger.info(`[Job] Scores recalculated for ${users.length} users`);
    } catch (err) {
      logger.error({ err }, '[Job] Score recalculation failed');
    }
  });

  // ── Leaderboard refresh every hour ───────────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    logger.info('[Job] Refreshing leaderboard ranks');
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      const weekKey = `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;

      await Promise.allSettled([
        leaderboardRepository.refreshRanks('daily', today),
        leaderboardRepository.refreshRanks('weekly', weekKey),
        leaderboardRepository.refreshRanks('monthly', monthKey),
      ]);
      logger.info('[Job] Leaderboard ranks refreshed');
    } catch (err) {
      logger.error({ err }, '[Job] Leaderboard refresh failed');
    }
  });

  // ── Cleanup expired tokens at 02:00 UTC ──────────────────────────────────
  cron.schedule('0 2 * * *', async () => {
    logger.info('[Job] Cleaning up expired sessions and tokens');
    try {
      const [sessions, tokens] = await Promise.all([
        prisma.refreshSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
        prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      ]);
      logger.info(`[Job] Cleaned ${sessions.count} sessions, ${tokens.count} reset tokens`);
    } catch (err) {
      logger.error({ err }, '[Job] Token cleanup failed');
    }
  });

  logger.info('⏰ Background jobs registered');
}
