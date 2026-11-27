import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { leaderboardService } from './leaderboard.service';
import { successResponse, errorResponse } from '../../types';

export const leaderboardController = {
  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as string) ?? 'weekly';
      res.json(successResponse(await leaderboardService.getLeaderboard(period)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch leaderboard')); }
  },

  async getMyRank(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as string) ?? 'weekly';
      res.json(successResponse(await leaderboardService.getMyRank(req.user!.userId, period)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch rank')); }
  },
};
