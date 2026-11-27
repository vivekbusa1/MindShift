import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { errorResponse } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
}
