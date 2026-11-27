import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { goalsService } from './goals.service';
import { successResponse, errorResponse } from '../../types';

export const goalsController = {
  async getGoals(req: AuthRequest, res: Response) {
    try {
      const goals = await goalsService.getGoals(req.user!.userId);
      res.json(successResponse(goals));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch goals'));
    }
  },
  async updateGoals(req: AuthRequest, res: Response) {
    try {
      const goals = await goalsService.updateGoals(req.user!.userId, req.body);
      res.json(successResponse(goals));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to update goals'));
    }
  },
};
