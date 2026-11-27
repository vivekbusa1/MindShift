import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET ?? 'access_secret_fallback',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET ?? 'refresh_secret_fallback',
    accessExpiry: (process.env.ACCESS_TOKEN_EXPIRY ?? '15m') as string,
    refreshExpiry: (process.env.REFRESH_TOKEN_EXPIRY ?? '7d') as string,
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:8081',
};
