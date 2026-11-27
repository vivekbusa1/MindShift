import { scoringRepository, computeDailyScore } from './scoring.repository';

export const scoringService = {
  async getDaily(userId: string, dateKey: string) {
    // Try to get existing, or compute fresh
    let score = await scoringRepository.getDaily(userId, dateKey);
    if (!score) score = await computeDailyScore(userId, dateKey);
    return score;
  },

  async getHistory(userId: string, startDate: string, endDate: string) {
    return scoringRepository.getHistory(userId, startDate, endDate);
  },

  async recalculate(userId: string, dateKey: string) {
    return computeDailyScore(userId, dateKey);
  },
};
