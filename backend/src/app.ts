import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import goalsRoutes from './modules/goals/goals.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import sleepRoutes from './modules/sleep/sleep.routes';
import scoringRoutes from './modules/scoring/scoring.routes';
import streaksRoutes from './modules/streaks/streaks.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import reportsRoutes from './modules/reports/reports.routes';

export function createApp() {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: config.nodeEnv === 'development' ? true : config.corsOrigin,
      credentials: true,
    })
  );

  // ── Rate limiting (global) ────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging ───────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  const api = '/api/v1';
  app.use(`${api}/auth`, authRoutes);
  app.use(`${api}/profile`, profileRoutes);
  app.use(`${api}/goals`, goalsRoutes);
  app.use(`${api}/activities`, activitiesRoutes);
  app.use(`${api}/sleep`, sleepRoutes);
  app.use(`${api}/scores`, scoringRoutes);
  app.use(`${api}/streaks`, streaksRoutes);
  app.use(`${api}/leaderboard`, leaderboardRoutes);
  app.use(`${api}/reports`, reportsRoutes);

  // ── 404 & error handlers ──────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
