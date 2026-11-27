import { activitiesRepository } from './activities.repository';
import { Prisma } from '@prisma/client';

// Simple keyword-based parser replicating Phase 1 logic server-side
function parseMessage(message: string, activities: { id: string; name: string; aliases: string[]; category: string; unit: string | null }[]) {
  const lower = message.toLowerCase().trim();
  const results: Array<{
    activityId: string;
    activityName: string;
    durationMin?: number;
    quantity?: number;
    unit?: string;
    rawMessage: string;
  }> = [];

  for (const activity of activities) {
    const keywords = [activity.name.toLowerCase(), ...activity.aliases.map(a => a.toLowerCase())];
    const matched = keywords.some(k => lower.includes(k));
    if (!matched) continue;

    // Try to extract duration in minutes
    const durationMatch = lower.match(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
    let durationMin: number | undefined;
    if (durationMatch) {
      const val = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2].toLowerCase();
      durationMin = unit.startsWith('h') ? val * 60 : val;
    }

    // Try to extract quantity
    const quantityMatch = lower.match(/(\d+(?:\.\d+)?)\s*(glass|glasses|litre|liter|km|km|step|steps|page|pages|rep|reps)/i);
    let quantity: number | undefined;
    let unit: string | undefined;
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = quantityMatch[2];
    }

    results.push({
      activityId: activity.id,
      activityName: activity.name,
      durationMin,
      quantity: quantity ?? (durationMin ? undefined : 1),
      unit: unit ?? activity.unit ?? undefined,
      rawMessage: message,
    });
  }

  return results;
}

export const activitiesService = {
  async getActivities(userId: string) {
    return activitiesRepository.findAll(userId);
  },

  async createActivity(userId: string, data: Prisma.ActivityCreateInput) {
    return activitiesRepository.create(userId, data);
  },

  async updateActivity(userId: string, id: string, data: Partial<Prisma.ActivityUpdateInput>) {
    const activity = await activitiesRepository.findById(id);
    if (!activity) throw { code: 'NOT_FOUND', message: 'Activity not found' };
    if (activity.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your activity' };
    return activitiesRepository.update(id, data);
  },

  async deleteActivity(userId: string, id: string) {
    const activity = await activitiesRepository.findById(id);
    if (!activity) throw { code: 'NOT_FOUND', message: 'Activity not found' };
    if (activity.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your activity' };
    return activitiesRepository.delete(id);
  },

  async getLogs(userId: string, filters: { dateKey?: string; startDate?: string; endDate?: string; category?: string }) {
    return activitiesRepository.getLogs(userId, filters);
  },

  async logActivity(userId: string, data: Prisma.ActivityLogUncheckedCreateInput) {
    return activitiesRepository.createLog(userId, data);
  },

  async updateLog(userId: string, logId: string, data: Partial<Prisma.ActivityLogUpdateInput>) {
    const log = await activitiesRepository.findLogById(logId);
    if (!log) throw { code: 'NOT_FOUND', message: 'Log not found' };
    if (log.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your log' };
    return activitiesRepository.updateLog(logId, data);
  },

  async deleteLog(userId: string, logId: string) {
    const log = await activitiesRepository.findLogById(logId);
    if (!log) throw { code: 'NOT_FOUND', message: 'Log not found' };
    if (log.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your log' };
    return activitiesRepository.deleteLog(logId);
  },

  async parseMessage(userId: string, message: string, dateKey: string) {
    const activities = await activitiesRepository.findAll(userId);
    const parsed = parseMessage(message, activities);
    return { parsed, dateKey, originalMessage: message };
  },
};
