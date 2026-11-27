import { DEMO_LEADERBOARD_BASE } from '../../constants';
import {
  ActivityCategory,
  ActivityLogEntry,
  CustomActivityDefinition,
  LeaderboardParticipant,
  LeaderboardPeriod,
  PersonalGoals,
  SleepSession,
  StreakState,
  UserProfile,
} from '../../types';
import { getPastDateKeys, getTodayDateKey } from '../../utils/date';
import { calculateDailyScore } from '../scoring/scoringEngine';

/**
 * Builds the Phase 1 local + demo leaderboard.
 * Uses capped, normalized 0-100 daily scores (or averaged 7-day / 30-day scores) rather than raw counts.
 * Demo participants are explicitly marked as demo data for Phase 1.
 */
export function buildLeaderboard(params: {
  period: LeaderboardPeriod;
  profile: UserProfile;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  streak: StreakState;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
  showCurrentUser: boolean;
}): {
  participants: LeaderboardParticipant[];
  currentUserRank: number | null;
  currentUserScore: number;
} {
  const {
    period,
    profile,
    logs,
    activities,
    goals,
    sleepSessions,
    streak,
    confirmedMissedByDate,
    showCurrentUser,
  } = params;

  const todayKey = getTodayDateKey(profile.timezone);
  const todayBreakdown = calculateDailyScore({
    dateKey: todayKey,
    logs,
    activities,
    goals,
    sleepSessions,
    confirmedMissedCategories: confirmedMissedByDate[todayKey] ?? [],
    isProtectedDay: streak.protectedDateKeys.includes(todayKey),
  });

  const computeAverageForDays = (days: number): number => {
    const keys = getPastDateKeys(todayKey, days);
    const scores = keys
      .map((k) =>
        calculateDailyScore({
          dateKey: k,
          logs,
          activities,
          goals,
          sleepSessions,
          confirmedMissedCategories: confirmedMissedByDate[k] ?? [],
          isProtectedDay: streak.protectedDateKeys.includes(k),
        })
      )
      .filter((d) => d.hasAnyLogs && !d.isProtectedDay);

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((s, d) => s + d.totalScore, 0) / scores.length);
  };

  const userDaily = todayBreakdown.totalScore;
  const userWeekly = computeAverageForDays(7);
  const userMonthly = computeAverageForDays(30);

  const professionLabel =
    profile.profession === 'Other' && profile.customProfession.trim()
      ? profile.customProfession.trim()
      : profile.profession;

  const list: LeaderboardParticipant[] = DEMO_LEADERBOARD_BASE.map((item) => ({
    ...item,
    isCurrentUser: false,
    isDemoUser: true,
  }));

  if (showCurrentUser) {
    list.push({
      id: profile.id,
      nickname: profile.nickname || profile.fullName || 'You',
      avatarId: profile.avatarId,
      professionLabel: `${professionLabel} (You)`,
      isCurrentUser: true,
      isDemoUser: false,
      dailyScore: userDaily,
      weeklyScore: userWeekly,
      monthlyScore: userMonthly,
      currentStreak: streak.currentStreak,
    });
  }

  const getScore = (p: LeaderboardParticipant): number => {
    if (period === 'daily') return p.dailyScore;
    if (period === 'weekly') return p.weeklyScore;
    return p.monthlyScore;
  };

  const sorted = [...list].sort((a, b) => {
    const diff = getScore(b) - getScore(a);
    if (diff !== 0) return diff;
    return b.currentStreak - a.currentStreak;
  });

  const userIndex = sorted.findIndex((p) => p.isCurrentUser);
  const currentUserScore =
    period === 'daily' ? userDaily : period === 'weekly' ? userWeekly : userMonthly;

  return {
    participants: sorted,
    currentUserRank: userIndex >= 0 ? userIndex + 1 : null,
    currentUserScore,
  };
}
