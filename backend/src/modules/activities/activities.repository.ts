import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export const activitiesRepository = {
  async findAll(userId: string) {
    return prisma.activity.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async findById(id: string) {
    return prisma.activity.findUnique({ where: { id } });
  },

  async create(userId: string, data: Prisma.ActivityCreateInput) {
    return prisma.activity.create({
      data: {
        name: data.name,
        category: data.category,
        icon: data.icon,
        unit: data.unit,
        aliases: (data.aliases as string[] | undefined) ?? [],
        scoreWeight: data.scoreWeight ?? 1.0,
        isCustom: true,
        isDefault: false,
        userId,
      },
    });
  },

  async update(id: string, data: Partial<Prisma.ActivityUpdateInput>) {
    return prisma.activity.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.activity.delete({ where: { id } });
  },

  async getLogs(userId: string, filters: { dateKey?: string; startDate?: string; endDate?: string; category?: string }) {
    const where: Prisma.ActivityLogWhereInput = { userId };

    if (filters.dateKey) {
      where.dateKey = filters.dateKey;
    } else if (filters.startDate || filters.endDate) {
      where.dateKey = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }

    if (filters.category) {
      where.activity = { category: filters.category };
    }

    return prisma.activityLog.findMany({
      where,
      include: { activity: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createLog(userId: string, data: Prisma.ActivityLogUncheckedCreateInput) {
    return prisma.activityLog.create({
      data: { ...data, userId },
      include: { activity: true },
    });
  },

  async updateLog(id: string, data: Partial<Prisma.ActivityLogUpdateInput>) {
    return prisma.activityLog.update({
      where: { id },
      data,
      include: { activity: true },
    });
  },

  async deleteLog(id: string) {
    return prisma.activityLog.delete({ where: { id } });
  },

  async findLogById(id: string) {
    return prisma.activityLog.findUnique({ where: { id }, include: { activity: true } });
  },
};
