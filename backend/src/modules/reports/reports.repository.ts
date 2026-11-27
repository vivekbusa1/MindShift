import { prisma } from '../../config/database';

function dateRange(startDate: string, endDate: string) {
  return { gte: startDate, lte: endDate };
}

function subtractDays(dateKey: string, days: number): string {
  const d = new Date(dateKey);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const reportsRepository = {
  async getDaily(userId: string, dateKey: string) {
    const [logs, sleep, score] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId, dateKey },
        include: { activity: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sleepSession.findFirst({ where: { userId, dateKey } }),
      prisma.dailyScore.findUnique({ where: { userId_dateKey: { userId, dateKey } } }),
    ]);
    return { dateKey, logs, sleep, score };
  },

  async getWeekly(userId: string, endDateKey: string) {
    const startDateKey = subtractDays(endDateKey, 6);
    const [scores, logs, sleep] = await Promise.all([
      prisma.dailyScore.findMany({
        where: { userId, dateKey: dateRange(startDateKey, endDateKey) },
        orderBy: { dateKey: 'asc' },
      }),
      prisma.activityLog.findMany({
        where: { userId, dateKey: dateRange(startDateKey, endDateKey) },
        include: { activity: true },
      }),
      prisma.sleepSession.findMany({
        where: { userId, dateKey: dateRange(startDateKey, endDateKey) },
        orderBy: { dateKey: 'asc' },
      }),
    ]);

    const totalScore = scores.reduce((a, s) => a + s.totalScore, 0);
    const avgScore = scores.length ? totalScore / scores.length : 0;
    const avgSleep = sleep.filter((s) => s.durationMin).reduce((a, s, _, arr) => a + (s.durationMin ?? 0) / arr.length, 0);

    const categoryBreakdown: Record<string, number> = {};
    for (const log of logs) {
      const cat = log.activity.category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + (log.durationMin ?? 0);
    }

    return { startDateKey, endDateKey, avgScore: Math.round(avgScore), avgSleepMin: Math.round(avgSleep), scores, categoryBreakdown };
  },

  async getMonthly(userId: string, year: number, month: number) {
    const startDateKey = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateKey = `${year}-${String(month).padStart(2, '0')}-31`;
    const [scores, sleep] = await Promise.all([
      prisma.dailyScore.findMany({
        where: { userId, dateKey: dateRange(startDateKey, endDateKey) },
        orderBy: { dateKey: 'asc' },
      }),
      prisma.sleepSession.findMany({
        where: { userId, dateKey: dateRange(startDateKey, endDateKey) },
      }),
    ]);

    const activeDays = scores.filter((s) => s.totalScore >= 30).length;
    const avgScore = scores.length ? scores.reduce((a, s) => a + s.totalScore, 0) / scores.length : 0;
    const avgSleep = sleep.filter((s) => s.durationMin).length
      ? sleep.filter((s) => s.durationMin).reduce((a, s) => a + (s.durationMin ?? 0), 0) / sleep.filter((s) => s.durationMin).length
      : 0;

    return { year, month, activeDays, avgScore: Math.round(avgScore), avgSleepMin: Math.round(avgSleep), scores };
  },
};
