import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { prisma } from './config/database';
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

  // Required behind Vercel / reverse proxies for express-rate-limit & IP detection
  app.set('trust proxy', 1);

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin:
        config.nodeEnv === 'development' || !process.env.CORS_ORIGIN
          ? true
          : config.corsOrigin.split(',').map((o) => o.trim()),
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
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Request logging ───────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    let database = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }
    res.status(database === 'ok' ? 200 : 503).json({
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Live Status & API Test Page ───────────────────────────────────────────
  const renderTestPage = (_req: express.Request, res: express.Response) => {
    res.removeHeader('Content-Security-Policy');
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MindShift API — Live Test Page</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 24px; background: #0b1628; color: #e2e8f0; }
    .wrap { max-width: 820px; margin: 0 auto; }
    .card { background: #132238; border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    h1 { margin: 0 0 6px; font-size: 22px; color: #2dd4bf; }
    .sub { color: #94a3b8; font-size: 14px; margin: 0; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; align-items: center; }
    button { background: #00a58a; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
    button:hover { background: #008c75; }
    button.sec { background: #1e3a5f; }
    input, select { background: #0b1628; color: #e2e8f0; border: 1px solid #2b4c7e; border-radius: 8px; padding: 9px 12px; font-size: 14px; }
    pre { background: #060d18; border: 1px solid #1e3a5f; border-radius: 8px; padding: 14px; overflow-x: auto; font-size: 13px; color: #7dd3fc; min-height: 90px; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #064e3b; color: #6ee7b7; }
    .endpoints { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; margin-top: 12px; font-size: 13px; }
    .ep { background: #0b1628; padding: 8px 10px; border-radius: 6px; border: 1px solid #1e3a5f; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>MindShift Backend <span class="badge">LIVE</span></h1>
      <p class="sub">Base API: <code>/api/v1</code> · Environment: <code>${config.nodeEnv}</code></p>
      <div class="row">
        <button onclick="callApi('GET', '/health')">Test /health &amp; DB</button>
        <button class="sec" onclick="testDemoLogin()">Test Demo Login</button>
        <button class="sec" onclick="callApi('GET', '/api/v1/scores/daily')">Test /scores/daily</button>
        <button class="sec" onclick="callApi('GET', '/api/v1/leaderboard')">Test /leaderboard</button>
      </div>
    </div>

    <div class="card">
      <strong>Custom Request Tester</strong>
      <div class="row">
        <select id="method">
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input id="path" value="/health" style="flex:1; min-width: 200px;" />
        <button onclick="callApi(document.getElementById('method').value, document.getElementById('path').value)">Send</button>
      </div>
      <p id="statusLine" class="sub" style="margin-top:12px;">Click any button above to test the live backend.</p>
      <pre id="output">{}</pre>
    </div>

    <div class="card">
      <strong>Available API Modules</strong>
      <div class="endpoints">
        <div class="ep">/api/v1/auth/*</div>
        <div class="ep">/api/v1/profile/*</div>
        <div class="ep">/api/v1/goals</div>
        <div class="ep">/api/v1/activities/*</div>
        <div class="ep">/api/v1/sleep/*</div>
        <div class="ep">/api/v1/scores/*</div>
        <div class="ep">/api/v1/streaks/*</div>
        <div class="ep">/api/v1/leaderboard/*</div>
        <div class="ep">/api/v1/reports/*</div>
      </div>
    </div>
  </div>
  <script>
    let token = '';
    async function callApi(method, path, body) {
      const start = performance.now();
      const statusEl = document.getElementById('statusLine');
      const outEl = document.getElementById('output');
      statusEl.textContent = 'Requesting ' + method + ' ' + path + '...';
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch(path, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        const ms = Math.round(performance.now() - start);
        const text = await res.text();
        let parsed = text;
        try { parsed = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        statusEl.textContent = 'Status: ' + res.status + ' ' + res.statusText + ' (' + ms + ' ms)';
        outEl.textContent = parsed;
        return res.ok ? JSON.parse(text) : null;
      } catch (err) {
        statusEl.textContent = 'Request failed';
        outEl.textContent = String(err);
      }
    }
    async function testDemoLogin() {
      const data = await callApi('POST', '/api/v1/auth/login', {
        email: 'demo@mindshift.app',
        password: 'demo1234',
      });
      if (data && data.data && data.data.accessToken) {
        token = data.data.accessToken;
        document.getElementById('statusLine').textContent += ' — JWT saved for further tests!';
      }
    }
  </script>
</body>
</html>`);
  };

  app.get('/', renderTestPage);
  app.get('/test', renderTestPage);

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
