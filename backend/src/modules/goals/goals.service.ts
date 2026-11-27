import { goalsRepository } from './goals.repository';

export const goalsService = {
  async getGoals(userId: string) {
    return goalsRepository.findByUserId(userId);
  },
  async updateGoals(userId: string, data: Record<string, unknown>) {
    return goalsRepository.upsert(userId, data);
  },
};
