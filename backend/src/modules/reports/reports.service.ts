import { reportsRepository } from './reports.repository';

function generateGuidance(avgScore: number, avgSleepMin: number): string[] {
  const tips: string[] = [];
  if (avgScore < 40) tips.push('Your overall score is low. Try logging at least 3 activities per day.');
  if (avgScore >= 40 && avgScore < 70) tips.push('Good progress! Focus on consistency to push your score above 70.');
  if (avgScore >= 70) tips.push('Excellent! You are maintaining a strong healthy routine.');
  if (avgSleepMin < 360) tips.push('You are getting less than 6 hours of sleep. Aim for 7-8 hours nightly.');
  if (avgSleepMin >= 360 && avgSleepMin < 420) tips.push('Sleep could be improved. Try setting a consistent bedtime.');
  if (avgSleepMin >= 420) tips.push('Your sleep duration is good. Keep maintaining a regular sleep schedule.');
  return tips;
}

export const reportsService = {
  async getDaily(userId: string, dateKey: string) {
    return reportsRepository.getDaily(userId, dateKey);
  },

  async getWeekly(userId: string, endDateKey: string) {
    return reportsRepository.getWeekly(userId, endDateKey);
  },

  async getMonthly(userId: string, year: number, month: number) {
    return reportsRepository.getMonthly(userId, year, month);
  },

  async getGuidance(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const weekly = await reportsRepository.getWeekly(userId, today);
    const tips = generateGuidance(weekly.avgScore, weekly.avgSleepMin);
    return { tips, basedOn: { avgScore: weekly.avgScore, avgSleepMin: weekly.avgSleepMin } };
  },
};
