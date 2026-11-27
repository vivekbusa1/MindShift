import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse, errorResponse } from '../../types';
import { AuthRequest } from '../../middleware/auth';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      res.status(201).json(successResponse(result));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'CONFLICT') return void res.status(409).json(errorResponse('CONFLICT', e.message ?? 'Conflict'));
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Registration failed'));
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(successResponse(result));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'UNAUTHORIZED') return void res.status(401).json(errorResponse('UNAUTHORIZED', e.message ?? 'Unauthorized'));
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Login failed'));
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json(successResponse(result));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      res.status(401).json(errorResponse(e.code ?? 'UNAUTHORIZED', e.message ?? 'Unauthorized'));
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken ?? '');
      res.json(successResponse({ message: 'Logged out' }));
    } catch {
      res.json(successResponse({ message: 'Logged out' }));
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      // In production: send email, return generic message
      // In dev: return token for testing
      res.json(successResponse({ message: 'Reset link sent (dev mode)', ...result }));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to process request'));
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json(successResponse({ message: 'Password reset successfully' }));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'UNAUTHORIZED') return void res.status(401).json(errorResponse('UNAUTHORIZED', e.message ?? 'Unauthorized'));
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Reset failed'));
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getMe(userId);
      res.json(successResponse(user));
    } catch {
      res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
    }
  },
};
