import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../../config';
import { authRepository } from './auth.repository';
import { AccessTokenPayload, RefreshTokenPayload } from '../../types';

function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as AccessTokenPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(): string {
  return randomUUID();
}

export const authService = {
  async register(email: string, password: string) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw { code: 'CONFLICT', message: 'Email already registered' };

    const passwordHash = await argon2.hash(password);
    const user = await authRepository.createUser(email, passwordHash);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshSession(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw { code: 'UNAUTHORIZED', message: 'Invalid email or password' };

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw { code: 'UNAUTHORIZED', message: 'Invalid email or password' };

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshSession(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  },

  async refresh(token: string) {
    const session = await authRepository.findRefreshSession(token);
    if (!session || session.expiresAt < new Date()) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' };
    }

    const user = await authRepository.findUserById(session.userId);
    if (!user) throw { code: 'UNAUTHORIZED', message: 'User not found' };

    // Rotate refresh token
    await authRepository.deleteRefreshSession(token);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshSession(user.id, newRefreshToken, expiresAt);

    const accessToken = generateAccessToken(user.id, user.email);
    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await authRepository.deleteRefreshSession(refreshToken);
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) return; // silent — don't leak whether email exists
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await authRepository.createPasswordResetToken(user.id, token, expiresAt);
    // In Phase 2: send email. For now, return token for local dev:
    return { resetToken: token };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await authRepository.findValidResetToken(token);
    if (!record) throw { code: 'UNAUTHORIZED', message: 'Invalid or expired reset token' };

    const passwordHash = await argon2.hash(newPassword);
    await authRepository.updatePasswordHash(record.userId, passwordHash);
    await authRepository.markResetTokenUsed(record.id);
    // Revoke all sessions for security
    await authRepository.deleteAllUserSessions(record.userId);
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw { code: 'NOT_FOUND', message: 'User not found' };
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  },
};
