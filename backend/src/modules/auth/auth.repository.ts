import { prisma } from '../../config/database';
import { User, RefreshSession } from '@prisma/client';

export const authRepository = {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: { email, passwordHash },
    });
  },

  async createRefreshSession(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<RefreshSession> {
    return prisma.refreshSession.create({
      data: { userId, token, expiresAt },
    });
  },

  async findRefreshSession(token: string): Promise<RefreshSession | null> {
    return prisma.refreshSession.findUnique({ where: { token } });
  },

  async deleteRefreshSession(token: string): Promise<void> {
    await prisma.refreshSession.deleteMany({ where: { token } });
  },

  async deleteAllUserSessions(userId: string): Promise<void> {
    await prisma.refreshSession.deleteMany({ where: { userId } });
  },

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
  },

  async findValidResetToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: { token, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  async markResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  async updatePasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },
};
