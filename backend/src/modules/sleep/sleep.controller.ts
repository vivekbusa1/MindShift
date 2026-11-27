import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { sleepService } from './sleep.service';
import { successResponse, errorResponse } from '../../types';

function handleErr(res: Response, err: unknown) {
  const e = err as { code?: string; message?: string };
  if (e.code === 'NOT_FOUND') return void res.status(404).json(errorResponse('NOT_FOUND', e.message ?? 'Not found'));
  if (e.code === 'FORBIDDEN') return void res.status(403).json(errorResponse('FORBIDDEN', e.message ?? 'Forbidden'));
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Operation failed'));
}

export const sleepController = {
  async getSessions(req: AuthRequest, res: Response) {
    try { res.json(successResponse(await sleepService.getSessions(req.user!.userId))); }
    catch (err) { handleErr(res, err); }
  },
  async logSleep(req: AuthRequest, res: Response) {
    try { res.status(201).json(successResponse(await sleepService.logSleep(req.user!.userId, { ...req.body, userId: req.user!.userId }))); }
    catch (err) { handleErr(res, err); }
  },
  async updateSession(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      res.json(successResponse(await sleepService.updateSession(req.user!.userId, id, req.body)));
    }
    catch (err) { handleErr(res, err); }
  },
  async deleteSession(req: AuthRequest, res: Response) {
    try {
      const id = String(req.params.id);
      await sleepService.deleteSession(req.user!.userId, id); res.json(successResponse({ message: 'Deleted' }));
    }
    catch (err) { handleErr(res, err); }
  },
  async getAnalysis(req: AuthRequest, res: Response) {
    try { res.json(successResponse(await sleepService.getAnalysis(req.user!.userId))); }
    catch (err) { handleErr(res, err); }
  },
};
