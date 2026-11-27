import { sleepRepository } from './sleep.repository';
import { Prisma } from '@prisma/client';

export const sleepService = {
  async getSessions(userId: string) {
    return sleepRepository.findAll(userId);
  },

  async logSleep(userId: string, data: Prisma.SleepSessionUncheckedCreateInput) {
    return sleepRepository.create(userId, data);
  },

  async updateSession(userId: string, id: string, data: Prisma.SleepSessionUpdateInput) {
    const session = await sleepRepository.findById(id);
    if (!session) throw { code: 'NOT_FOUND', message: 'Sleep session not found' };
    if (session.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your session' };

    const updated: Prisma.SleepSessionUpdateInput = { ...data };
    if (data.bedtime || data.wakeTime) {
      const bedtime = data.bedtime ? new Date(data.bedtime as string) : session.bedtime;
      const wakeTime = data.wakeTime ? new Date(data.wakeTime as string) : session.wakeTime;
      if (wakeTime) {
        (updated as Record<string, unknown>).durationMin = Math.round(
          (wakeTime.getTime() - bedtime.getTime()) / 60000
        );
        (updated as Record<string, unknown>).crossesMidnight =
          wakeTime.getDate() !== bedtime.getDate();
      }
    }
    return sleepRepository.update(id, updated);
  },

  async deleteSession(userId: string, id: string) {
    const session = await sleepRepository.findById(id);
    if (!session) throw { code: 'NOT_FOUND', message: 'Sleep session not found' };
    if (session.userId !== userId) throw { code: 'FORBIDDEN', message: 'Not your session' };
    return sleepRepository.delete(id);
  },

  async getAnalysis(userId: string) {
    const sessions = await sleepRepository.getRecent(userId, 14);
    const withDuration = sessions.filter((s) => s.durationMin != null);
    if (withDuration.length === 0) {
      return { avgDurationMin: 0, consistency: 'insufficient_data', sessions: [] };
    }

    const avgDurationMin = Math.round(
      withDuration.reduce((acc, s) => acc + (s.durationMin ?? 0), 0) / withDuration.length
    );

    const bedtimeHours = withDuration.map((s) => s.bedtime.getHours() + s.bedtime.getMinutes() / 60);
    const avgBedtime = bedtimeHours.reduce((a, b) => a + b, 0) / bedtimeHours.length;
    const stdDev = Math.sqrt(
      bedtimeHours.reduce((acc, h) => acc + Math.pow(h - avgBedtime, 2), 0) / bedtimeHours.length
    );
    const consistency = stdDev < 0.5 ? 'excellent' : stdDev < 1 ? 'good' : stdDev < 1.5 ? 'fair' : 'poor';

    return { avgDurationMin, consistency, sessions, stdDevHours: parseFloat(stdDev.toFixed(2)) };
  },
};
