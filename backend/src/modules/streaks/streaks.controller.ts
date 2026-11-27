import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { streaksService } from './streaks.service';
import { successResponse, errorResponse } from '../../types';

export const streaksController = {
  async getStreak(req: AuthRequest, res: Response) {
    try { res.json(successResponse(await streaksService.getStreak(req.user!.userId))); }
    catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch streak')); }
  },

  async getCalendar(req: AuthRequest, res: Response) {
    try {
      const year = parseInt((req.query.year as string) ?? new Date().getFullYear().toString(), 10);
      const month = parseInt((req.query.month as string) ?? String(new Date().getMonth() + 1), 10);
      res.json(successResponse(await streaksService.getCalendar(req.user!.userId, year, month)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch calendar')); }
  },

  async getShields(req: AuthRequest, res: Response) {
    try { res.json(successResponse(await streaksService.getShields(req.user!.userId))); }
    catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch shields')); }
  },

  async useShield(req: AuthRequest, res: Response) {
    try {
      const { shieldId } = req.body as { shieldId: string };
      res.json(successResponse(await streaksService.useShield(req.user!.userId, shieldId)));
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'NOT_FOUND') return void res.status(404).json(errorResponse('NOT_FOUND', e.message ?? 'Not found'));
      if (e.code === 'CONFLICT') return void res.status(409).json(errorResponse('CONFLICT', e.message ?? 'Conflict'));
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to use shield'));
    }
  },
};
