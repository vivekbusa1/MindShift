import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { scoringService } from './scoring.service';
import { successResponse, errorResponse } from '../../types';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const scoringController = {
  async getDaily(req: AuthRequest, res: Response) {
    try {
      const dateKey = (req.query.dateKey as string) ?? todayKey();
      res.json(successResponse(await scoringService.getDaily(req.user!.userId, dateKey)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch score')); }
  },

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query as Record<string, string>;
      const end = endDate ?? todayKey();
      const start = startDate ?? end;
      res.json(successResponse(await scoringService.getHistory(req.user!.userId, start, end)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch history')); }
  },

  async recalculate(req: AuthRequest, res: Response) {
    try {
      const dateKey = (req.body.dateKey as string) ?? todayKey();
      res.json(successResponse(await scoringService.recalculate(req.user!.userId, dateKey)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to recalculate')); }
  },
};
