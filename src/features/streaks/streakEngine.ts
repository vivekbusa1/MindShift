import {
  DAYS_PER_SHIELD,
  ELIGIBLE_STREAK_MIN_SCORE,
  STREAK_MILESTONES,
} from '../../constants';
import {
  ActivityCategory,
  ActivityLogEntry,
  CustomActivityDefinition,
  DayStreakStatus,
  PersonalGoals,
  RecoveryShieldHistoryEntry,
  SleepSession,
  StreakState,
} from '../../types';
import { createId, getPastDateKeys, getTodayDateKey, shiftDateKey } from '../../utils/date';
import { calculateDailyScore } from '../scoring/scoringEngine';

export function createInitialStreakState(): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    completedDateKeys: [],
    protectedDateKeys: [],
    missedDateKeys: [],
    availableShields: 1, // Starter recovery shield explained in onboarding
    shieldProgressDays: 0,
    lastEvaluatedDateKey: null,
    shieldHistory: [],
  };
}

/**
 * A day is eligible for streak credit only when meaningful daily goals are achieved
 * (totalScore >= ELIGIBLE_STREAK_MIN_SCORE and at least 2 logged events), never merely opening the app.
 */
export function isDateEligibleForStreak(params: {
  dateKey: string;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  protectedDateKeys: string[];
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
}): { eligible: boolean; score: number } {
  const {
    dateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    protectedDateKeys,
    confirmedMissedByDate,
  } = params;

  if (protectedDateKeys.includes(dateKey)) {
    return { eligible: false, score: 0 };
  }

  const dayLogs = logs.filter((l) => l.dateKey === dateKey);
  if (dayLogs.length < 2) {
    return { eligible: false, score: 0 };
  }

  const breakdown = calculateDailyScore({
    dateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    confirmedMissedCategories: confirmedMissedByDate[dateKey] ?? [],
    isProtectedDay: false,
  });

  return {
    eligible: breakdown.totalScore >= ELIGIBLE_STREAK_MIN_SCORE,
    score: breakdown.totalScore,
  };
}

/**
 * Recomputes streak, milestones, missed days, and shield earnings deterministically from local records.
 * Never counts the same day twice and respects the user's configured timezone.
 */
export function recomputeStreakState(params: {
  previous: StreakState;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
  timezone: string;
}): StreakState {
  const {
    previous,
    logs,
    activities,
    goals,
    sleepSessions,
    confirmedMissedByDate,
    timezone,
  } = params;

  const todayKey = getTodayDateKey(timezone);
  const protectedSet = new Set(previous.protectedDateKeys);

  // Inspect past 60 days up to today in configured timezone
  const windowKeys = getPastDateKeys(todayKey, 60);
  const completedSet = new Set<string>();
  const missedSet = new Set<string>();

  // Only mark days after the user's earliest log as missed when unfulfilled
  const allLogDates = logs.map((l) => l.dateKey).sort();
  const earliestLogDate = allLogDates[0] ?? todayKey;

  for (const key of windowKeys) {
    if (protectedSet.has(key)) continue;
    const { eligible } = isDateEligibleForStreak({
      dateKey: key,
      logs,
      activities,
      goals,
      sleepSessions,
      protectedDateKeys: previous.protectedDateKeys,
      confirmedMissedByDate,
    });
    if (eligible) {
      completedSet.add(key);
    } else if (key < todayKey && key >= earliestLogDate) {
      missedSet.add(key);
    }
  }

  const completedDateKeys = Array.from(completedSet).sort();
  const protectedDateKeys = Array.from(protectedSet).sort();
  const missedDateKeys = Array.from(missedSet).sort();

  // Compute current streak walking backwards from today (if today isn't eligible yet, start from yesterday)
  let currentStreak = 0;
  let cursor = completedSet.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);

  while (true) {
    if (completedSet.has(cursor)) {
      currentStreak += 1;
      cursor = shiftDateKey(cursor, -1);
    } else if (protectedSet.has(cursor)) {
      // Protected days preserve the streak without adding extra streak count
      cursor = shiftDateKey(cursor, -1);
    } else {
      break;
    }
  }

  // Compute longest streak across window
  let longestStreak = previous.longestStreak;
  let running = 0;
  for (const key of windowKeys) {
    if (completedSet.has(key)) {
      running += 1;
      if (running > longestStreak) longestStreak = running;
    } else if (!protectedSet.has(key)) {
      running = 0;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Shield earning: 1 shield for every 7 eligible completed days (preventing duplicate redemption)
  const totalEarnedFromDays = Math.floor(completedDateKeys.length / DAYS_PER_SHIELD);
  const previouslyUsed = previous.shieldHistory.filter((h) => h.type === 'used').length;
  const existingEarnedRecords = previous.shieldHistory.filter((h) => h.type === 'earned').length;

  const newHistory: RecoveryShieldHistoryEntry[] = [...previous.shieldHistory];
  if (totalEarnedFromDays > existingEarnedRecords) {
    for (let i = existingEarnedRecords; i < totalEarnedFromDays; i++) {
      newHistory.unshift({
        id: createId('shield-earn'),
        type: 'earned',
        dateKey: todayKey,
        timestamp: new Date().toISOString(),
        note: `Earned 1 Recovery Shield for completing ${DAYS_PER_SHIELD} eligible days.`,
      });
    }
  }

  // Starter shield (1) + earned - used
  const availableShields = Math.max(0, 1 + totalEarnedFromDays - previouslyUsed);
  const shieldProgressDays = completedDateKeys.length % DAYS_PER_SHIELD;

  return {
    currentStreak,
    longestStreak,
    completedDateKeys,
    protectedDateKeys,
    missedDateKeys,
    availableShields,
    shieldProgressDays,
    lastEvaluatedDateKey: todayKey,
    shieldHistory: newHistory,
  };
}

/**
 * Manually applies 1 Recovery Shield to protect a missed day.
 * Prevents duplicate protection on the same day or protecting already completed days.
 */
export function applyRecoveryShield(
  streak: StreakState,
  targetDateKey: string,
  todayKey: string
): { success: boolean; message: string; updated?: StreakState } {
  if (streak.availableShields <= 0) {
    return {
      success: false,
      message: 'No Recovery Shields available right now. Complete 7 eligible days to earn one.',
    };
  }
  if (targetDateKey >= todayKey) {
    return {
      success: false,
      message: 'You can only apply a Recovery Shield to a past missed day.',
    };
  }
  if (streak.protectedDateKeys.includes(targetDateKey)) {
    return {
      success: false,
      message: 'This day is already protected by a Recovery Shield.',
    };
  }
  if (streak.completedDateKeys.includes(targetDateKey)) {
    return {
      success: false,
      message: 'This day already met your goal target—no shield needed.',
    };
  }

  const entry: RecoveryShieldHistoryEntry = {
    id: createId('shield-use'),
    type: 'used',
    dateKey: targetDateKey,
    timestamp: new Date().toISOString(),
    note: `Protected missed day (${targetDateKey}). No activity points generated for this day.`,
  };

  return {
    success: true,
    message: `Recovery Shield applied to ${targetDateKey}. Your streak is protected!`,
    updated: {
      ...streak,
      protectedDateKeys: [...streak.protectedDateKeys, targetDateKey].sort(),
      missedDateKeys: streak.missedDateKeys.filter((d) => d !== targetDateKey),
      availableShields: streak.availableShields - 1,
      shieldHistory: [entry, ...streak.shieldHistory],
    },
  };
}

export function getNextStreakMilestone(currentStreak: number): {
  target: number;
  remaining: number;
  progressPercent: number;
} {
  const next = STREAK_MILESTONES.find((m) => m > currentStreak) ?? 100;
  const prev =
    [...STREAK_MILESTONES].reverse().find((m) => m <= currentStreak) ?? 0;
  const span = Math.max(1, next - prev);
  const progressPercent = Math.min(
    100,
    Math.round(((currentStreak - prev) / span) * 100)
  );
  return {
    target: next,
    remaining: Math.max(0, next - currentStreak),
    progressPercent,
  };
}

export function getDayStreakStatus(
  dateKey: string,
  streak: StreakState,
  todayKey: string
): DayStreakStatus {
  if (streak.protectedDateKeys.includes(dateKey)) return 'protected';
  if (streak.completedDateKeys.includes(dateKey)) return 'completed';
  if (streak.missedDateKeys.includes(dateKey)) return 'missed';
  if (dateKey === todayKey) return 'pending';
  return 'empty';
}
