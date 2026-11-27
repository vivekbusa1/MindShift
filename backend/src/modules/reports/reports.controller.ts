import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { reportsService } from './reports.service';
import { successResponse, errorResponse } from '../../types';

export const reportsController = {
  async getDaily(req: AuthRequest, res: Response) {
    try {
      const dateKey = (req.query.dateKey as string) ?? new Date().toISOString().slice(0, 10);
      res.json(successResponse(await reportsService.getDaily(req.user!.userId, dateKey)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch report')); }
  },

  async getWeekly(req: AuthRequest, res: Response) {
    try {
      const endDateKey = (req.query.endDate as string) ?? new Date().toISOString().slice(0, 10);
      res.json(successResponse(await reportsService.getWeekly(req.user!.userId, endDateKey)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch weekly report')); }
  },

  async getMonthly(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const year = parseInt((req.query.year as string) ?? now.getFullYear().toString(), 10);
      const month = parseInt((req.query.month as string) ?? String(now.getMonth() + 1), 10);
      res.json(successResponse(await reportsService.getMonthly(req.user!.userId, year, month)));
    } catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch monthly report')); }
  },

  async getGuidance(req: AuthRequest, res: Response) {
    try { res.json(successResponse(await reportsService.getGuidance(req.user!.userId))); }
    catch { res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch guidance')); }
  },
};
