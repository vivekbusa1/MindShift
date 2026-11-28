import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { leaderboardService, LeaderboardScope } from './leaderboard.service';
import { successResponse, errorResponse } from '../../types';

function parseScope(raw: unknown): LeaderboardScope {
  if (raw === 'city' || raw === 'state' || raw === 'country') return raw;
  return 'global';
}

export const leaderboardController = {
  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as string) ?? 'weekly';
      const scope = parseScope(req.query.scope);
      res.json(
        successResponse(
          await leaderboardService.getLeaderboard(req.user!.userId, period, scope)
        )
      );
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch leaderboard'));
    }
  },

  async getMyRank(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as string) ?? 'weekly';
      const scope = parseScope(req.query.scope);
      res.json(
        successResponse(
          await leaderboardService.getMyRank(req.user!.userId, period, scope)
        )
      );
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch rank'));
    }
  },
};
