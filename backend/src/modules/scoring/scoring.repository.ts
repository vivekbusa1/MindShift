import { prisma } from '../../config/database';

const WEIGHTS = {
  sleep: 0.30,
  fitness: 0.25,
  productivity: 0.25,
  nutrition: 0.10,
  mindfulness: 0.10,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export async function computeDailyScore(userId: string, dateKey: string) {
  const [logs, sleep, goals] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId, dateKey },
      include: { activity: true },
    }),
    prisma.sleepSession.findFirst({ where: { userId, dateKey } }),
    prisma.userGoal.findUnique({ where: { userId } }),
  ]);

  // — Sleep score —
  let sleepScore = 0;
  if (sleep?.durationMin) {
    const target = goals?.sleepDurationMin ?? 480;
    const ratio = sleep.durationMin / target;
    sleepScore = clamp(ratio >= 1 ? 100 : ratio * 100);
  }

  // — Fitness score —
  const fitnessLogs = logs.filter((l) => l.activity.category === 'fitness');
  const fitnessMin = fitnessLogs.reduce((acc, l) => acc + (l.durationMin ?? 0), 0);
  const fitnessTarget = goals?.workoutMin ?? 30;
  const fitnessScore = clamp(fitnessMin >= fitnessTarget ? 100 : (fitnessMin / fitnessTarget) * 100);

  // — Productivity score —
  const prodLogs = logs.filter((l) => l.activity.category === 'productivity');
  const prodMin = prodLogs.reduce((acc, l) => acc + (l.durationMin ?? 0), 0);
  const prodTarget = goals?.studyWorkMin ?? 480;
  const productivityScore = clamp(prodMin >= prodTarget ? 100 : (prodMin / prodTarget) * 100);

  // — Nutrition score —
  const nutritionLogs = logs.filter((l) => l.activity.category === 'nutrition');
  const nutritionScore = clamp(nutritionLogs.length * 20); // 5+ logs = 100

  // — Mindfulness score —
  const mindfulnessLogs = logs.filter((l) => l.activity.category === 'mindfulness');
  const mindfulnessScore = clamp(mindfulnessLogs.length * 25); // 4+ logs = 100

  const totalScore = clamp(
    sleepScore * WEIGHTS.sleep +
    fitnessScore * WEIGHTS.fitness +
    productivityScore * WEIGHTS.productivity +
    nutritionScore * WEIGHTS.nutrition +
    mindfulnessScore * WEIGHTS.mindfulness
  );

  const breakdown = { sleepMin: sleep?.durationMin, fitnessMin, productivityMin: prodMin };

  const score = await prisma.dailyScore.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    create: { userId, dateKey, totalScore, sleepScore, fitnessScore, productivityScore, nutritionScore, mindfulnessScore, breakdown },
    update: { totalScore, sleepScore, fitnessScore, productivityScore, nutritionScore, mindfulnessScore, breakdown },
  });

  return score;
}

export const scoringRepository = {
  async getDaily(userId: string, dateKey: string) {
    return prisma.dailyScore.findUnique({ where: { userId_dateKey: { userId, dateKey } } });
  },

  async getHistory(userId: string, startDate: string, endDate: string) {
    return prisma.dailyScore.findMany({
      where: { userId, dateKey: { gte: startDate, lte: endDate } },
      orderBy: { dateKey: 'asc' },
    });
  },
};
