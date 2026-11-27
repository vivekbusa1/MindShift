# Mindshift — Full Stack Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm

---

## 1. Start PostgreSQL

### Option A — Docker (recommended)
```bash
docker compose up postgres -d
```

### Option B — Local PostgreSQL
Create a database manually:
```sql
CREATE USER mindshift WITH PASSWORD 'mindshift_dev';
CREATE DATABASE mindshift OWNER mindshift;
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database (default activities + demo user)
npm run db:seed

# Start development server (port 3000)
npm run dev
```

**Demo user:** `demo@mindshift.app` / `demo1234`

---

## 3. Frontend Setup

```bash
# From project root
npx expo install      # already done

# Start Expo dev server
npx expo start
```

---

## 4. API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| GET/PUT | `/api/v1/profile` | User profile |
| GET/PUT | `/api/v1/profile/preferences` | User preferences |
| GET/PUT | `/api/v1/goals` | User goals |
| GET | `/api/v1/activities` | List all activities |
| POST | `/api/v1/activities` | Create custom activity |
| GET | `/api/v1/activities/logs` | Get activity logs |
| POST | `/api/v1/activities/logs` | Log an activity |
| POST | `/api/v1/activities/logs/parse` | Parse natural language → log |
| GET | `/api/v1/sleep` | Sleep sessions |
| POST | `/api/v1/sleep` | Log sleep |
| GET | `/api/v1/sleep/analysis` | Sleep consistency analysis |
| GET | `/api/v1/scores/daily` | Daily score + breakdown |
| GET | `/api/v1/scores/history` | Score history |
| GET | `/api/v1/streaks` | Streak info |
| GET | `/api/v1/streaks/calendar` | Month calendar |
| GET | `/api/v1/streaks/shields` | Available shields |
| POST | `/api/v1/streaks/shields/use` | Apply shield |
| GET | `/api/v1/leaderboard` | Leaderboard |
| GET | `/api/v1/leaderboard/me` | My rank |
| GET | `/api/v1/reports/daily` | Daily report |
| GET | `/api/v1/reports/weekly` | Weekly report |
| GET | `/api/v1/reports/monthly` | Monthly report |
| GET | `/api/v1/reports/guidance` | Personalized guidance |

---

## 5. Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Authentication |
| `refresh_sessions` | JWT refresh tokens |
| `password_reset_tokens` | Password reset |
| `user_profiles` | Profile info |
| `user_preferences` | App settings |
| `user_goals` | Daily targets |
| `activities` | Activity definitions |
| `activity_logs` | Daily activity entries |
| `sleep_sessions` | Sleep tracking |
| `daily_scores` | Gamification scores |
| `user_streaks` | Streak tracking |
| `shields` | Recovery shields |
| `leaderboard_entries` | Rankings |

---

## 6. Frontend Hooks Available

```typescript
// Auth
import { useLogin, useRegister, useLogout, useMe } from '@/hooks/useAuth';

// Activities
import { useActivities, useActivityLogs, useLogActivity, useParseMessage } from '@/hooks/useActivities';

// Sleep
import { useSleepSessions, useLogSleep, useSleepAnalysis } from '@/hooks/useSleep';

// Scores
import { useDailyScore, useScoreHistory } from '@/hooks/useScores';

// Streaks
import { useStreak, useStreakCalendar, useShields, useUseShield } from '@/hooks/useStreaks';

// Leaderboard
import { useLeaderboard, useMyRank } from '@/hooks/useLeaderboard';

// Reports
import { useDailyReport, useWeeklyReport, useMonthlyReport, useGuidance } from '@/hooks/useReports';

// Profile
import { useProfile, useUpdateProfile, useGoals, useUpdateGoals } from '@/hooks/useProfile';
```

---

## 7. Background Jobs (auto-running)

| Job | Schedule | Purpose |
|-----|----------|---------|
| Streak reset | Daily 00:01 UTC | Reset broken streaks / apply shields |
| Shield expiry | Daily 00:05 UTC | Delete expired shields |
| Score recalculation | Daily 23:55 UTC | Finalize daily scores |
| Leaderboard refresh | Hourly | Update rankings |
| Token cleanup | Daily 02:00 UTC | Delete expired sessions |

---

## 8. Tech Stack

**Frontend:** React Native · Expo SDK 58 · TypeScript · Expo Router · Zustand · TanStack Query · Axios · Expo SecureStore

**Backend:** Node.js 20 · Express · TypeScript · PostgreSQL 16 · Prisma ORM · Argon2id · JWT · Zod · Pino · node-cron
