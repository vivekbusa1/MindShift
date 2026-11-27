import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { activitiesService } from './activities.service';
import { successResponse, errorResponse } from '../../types';

function handleError(res: Response, err: unknown) {
  const e = err as { code?: string; message?: string };
  if (e.code === 'NOT_FOUND') return void res.status(404).json(errorResponse('NOT_FOUND', e.message ?? 'Not found'));
  if (e.code === 'FORBIDDEN') return void res.status(403).json(errorResponse('FORBIDDEN', e.message ?? 'Forbidden'));
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Operation failed'));
}

export const activitiesController = {
  async getActivities(req: AuthRequest, res: Response) {
    try {
      const data = await activitiesService.getActivities(req.user!.userId);
      res.json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async createActivity(req: AuthRequest, res: Response) {
    try {
      const data = await activitiesService.createActivity(req.user!.userId, req.body);
      res.status(201).json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async updateActivity(req: AuthRequest, res: Response) {
    try {
      const data = await activitiesService.updateActivity(req.user!.userId, String(req.params.id), req.body);
      res.json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async deleteActivity(req: AuthRequest, res: Response) {
    try {
      await activitiesService.deleteActivity(req.user!.userId, String(req.params.id));
      res.json(successResponse({ message: 'Deleted' }));
    } catch (err) { handleError(res, err); }
  },

  async getLogs(req: AuthRequest, res: Response) {
    try {
      const { dateKey, startDate, endDate, category } = req.query as Record<string, string>;
      const data = await activitiesService.getLogs(req.user!.userId, { dateKey, startDate, endDate, category });
      res.json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async logActivity(req: AuthRequest, res: Response) {
    try {
      const data = await activitiesService.logActivity(req.user!.userId, { ...req.body, userId: req.user!.userId });
      res.status(201).json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async updateLog(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const data = await activitiesService.updateLog(req.user!.userId, id, req.body);
      res.json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },

  async deleteLog(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      await activitiesService.deleteLog(req.user!.userId, id);
      res.json(successResponse({ message: 'Deleted' }));
    } catch (err) { handleError(res, err); }
  },

  async parseMessage(req: AuthRequest, res: Response) {
    try {
      const { message, dateKey } = req.body;
      const data = await activitiesService.parseMessage(req.user!.userId, message, dateKey);
      res.json(successResponse(data));
    } catch (err) { handleError(res, err); }
  },
};
