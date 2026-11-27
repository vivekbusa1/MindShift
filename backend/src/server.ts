import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { config } from './config';
import { logger } from './config/logger';
import { registerJobs } from './jobs';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  registerJobs();

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`🚀 Mindshift API running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`📡 Health: http://localhost:${config.port}/health`);
    logger.info(`📚 API:    http://localhost:${config.port}/api/v1`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down');
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    logger.info('SIGINT received — shutting down');
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
