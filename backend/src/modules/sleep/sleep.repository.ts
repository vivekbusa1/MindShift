import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export const sleepRepository = {
  async findAll(userId: string) {
    return prisma.sleepSession.findMany({
      where: { userId },
      orderBy: { bedtime: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.sleepSession.findUnique({ where: { id } });
  },

  async findByDateKey(userId: string, dateKey: string) {
    return prisma.sleepSession.findFirst({ where: { userId, dateKey } });
  },

  async create(userId: string, data: Prisma.SleepSessionUncheckedCreateInput) {
    const bedtime = new Date(data.bedtime as string);
    const wakeTime = data.wakeTime ? new Date(data.wakeTime as string) : undefined;

    let durationMin: number | undefined;
    let crossesMidnight = false;

    if (wakeTime) {
      durationMin = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);
      crossesMidnight =
        wakeTime.getDate() !== bedtime.getDate() ||
        wakeTime.getMonth() !== bedtime.getMonth();
    }

    return prisma.sleepSession.create({
      data: {
        ...data,
        userId,
        bedtime,
        wakeTime: wakeTime ?? null,
        durationMin: durationMin ?? null,
        crossesMidnight,
      },
    });
  },

  async update(id: string, data: Prisma.SleepSessionUpdateInput) {
    return prisma.sleepSession.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.sleepSession.delete({ where: { id } });
  },

  async getRecent(userId: string, days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.sleepSession.findMany({
      where: { userId, bedtime: { gte: since } },
      orderBy: { bedtime: 'asc' },
    });
  },
};
