import { CATEGORY_META, SCORING_WEIGHTS } from '../../constants';
import {
  ActivityCategory,
  ActivityLogEntry,
  CategoryScoreBreakdown,
  CustomActivityDefinition,
  DailyScoreBreakdown,
  GoalRecordStatus,
  PersonalGoals,
  SleepSession,
} from '../../types';
import { formatDurationMinutes } from '../../utils/date';
import { getSleepSessionForDate } from '../sleep/sleepEngine';

export interface ScoringEngineConfig {
  weights: Record<ActivityCategory, number>;
  confirmedMissDeduction: Record<ActivityCategory, number>;
}

export const DEFAULT_SCORING_CONFIG: ScoringEngineConfig = {
  weights: { ...SCORING_WEIGHTS },
  confirmedMissDeduction: {
    sleep_recovery: 4,
    health_fitness: 5,
    work_study: 5,
    personal_development: 3,
    daily_routine: 3,
  },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getDurationMinutesForLogs(
  logs: ActivityLogEntry[],
  activityMatcher: (log: ActivityLogEntry) => boolean
): number {
  return logs
    .filter((l) => l.eventKind === 'end' && activityMatcher(l))
    .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
}

function getQuantityForLogs(
  logs: ActivityLogEntry[],
  activityMatcher: (log: ActivityLogEntry) => boolean
): number {
  return logs
    .filter((l) => l.eventKind === 'quantity' && activityMatcher(l))
    .reduce((sum, l) => sum + (l.quantity ?? 0), 0);
}

/**
 * Evaluates a single day's lifestyle gamification score (0..100).
 * Missing logs are marked 'not_recorded', NOT treated as failures unless explicitly confirmed missed.
 * Ratios are capped at 1.0 so repeated logging or extra workout/work duration cannot inflate points.
 */
export function calculateDailyScore(params: {
  dateKey: string;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  confirmedMissedCategories?: ActivityCategory[];
  isProtectedDay?: boolean;
  config?: ScoringEngineConfig;
}): DailyScoreBreakdown {
  const {
    dateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    confirmedMissedCategories = [],
    isProtectedDay = false,
    config = DEFAULT_SCORING_CONFIG,
  } = params;

  const dayLogs = logs.filter((l) => l.dateKey === dateKey);
  const sleepSession = getSleepSessionForDate(dateKey, sleepSessions, goals);

  // Protected days do not generate activity points (per Recovery Shield rule)
  if (isProtectedDay) {
    const protectedCategories: CategoryScoreBreakdown[] = (
      Object.keys(config.weights) as ActivityCategory[]
    ).map((cat) => ({
      category: cat,
      label: CATEGORY_META[cat].label,
      maxWeight: config.weights[cat],
      earnedPoints: 0,
      deductedPoints: 0,
      netPoints: 0,
      completionRatio: 0,
      status: 'not_recorded',
      details: 'Protected by Recovery Shield (no activity points generated).',
    }));

    return {
      dateKey,
      totalScore: 0,
      positivePoints: 0,
      negativePoints: 0,
      goalCompletionPercent: 0,
      isProtectedDay: true,
      hasAnyLogs: dayLogs.length > 0,
      categories: protectedCategories,
      sleepMinutes: sleepSession.durationMinutes ?? null,
      workoutMinutes: 0,
      workStudyMinutes: 0,
      waterMl: 0,
      personalDevMinutes: 0,
      routineEventsCount: 0,
      confirmedMissedCategories,
    };
  }

  const sleepMinutes = sleepSession.durationMinutes ?? null;
  const workoutMinutes = getDurationMinutesForLogs(
    dayLogs,
    (l) =>
      l.category === 'health_fitness' &&
      (l.activityId === 'act-workout' || l.activityName.toLowerCase().includes('workout'))
  );
  const walkingMinutes = getDurationMinutesForLogs(
    dayLogs,
    (l) =>
      l.category === 'health_fitness' &&
      (l.activityId === 'act-walking' || l.activityName.toLowerCase().includes('walk'))
  );
  const otherFitnessMinutes = getDurationMinutesForLogs(
    dayLogs,
    (l) =>
      l.category === 'health_fitness' &&
      l.activityId !== 'act-workout' &&
      l.activityId !== 'act-walking'
  );
  const waterMl = getQuantityForLogs(
    dayLogs,
    (l) => l.activityId === 'act-water' || l.activityName.toLowerCase().includes('water')
  );
  const workStudyMinutes = getDurationMinutesForLogs(
    dayLogs,
    (l) => l.category === 'work_study'
  );
  const personalDevMinutes = getDurationMinutesForLogs(
    dayLogs,
    (l) => l.category === 'personal_development'
  );
  const readingPages = getQuantityForLogs(
    dayLogs,
    (l) =>
      l.category === 'personal_development' &&
      (l.activityId === 'act-reading' || l.unit === 'pages')
  );

  // 1. Sleep & Recovery (Weight 20)
  const sleepBreakdown = scoreSleepCategory({
    maxWeight: config.weights.sleep_recovery,
    sleepSession,
    dayLogs,
    goals,
    isConfirmedMiss: confirmedMissedCategories.includes('sleep_recovery'),
    missDeduction: config.confirmedMissDeduction.sleep_recovery,
  });

  // 2. Health & Fitness (Weight 25)
  const fitnessBreakdown = scoreFitnessCategory({
    maxWeight: config.weights.health_fitness,
    workoutMinutes: workoutMinutes + otherFitnessMinutes,
    walkingMinutes,
    waterMl,
    dayLogs,
    goals,
    isConfirmedMiss: confirmedMissedCategories.includes('health_fitness'),
    missDeduction: config.confirmedMissDeduction.health_fitness,
  });

  // 3. Work & Study (Weight 25)
  const workStudyBreakdown = scoreWorkStudyCategory({
    maxWeight: config.weights.work_study,
    workStudyMinutes,
    dayLogs,
    goals,
    isConfirmedMiss: confirmedMissedCategories.includes('work_study'),
    missDeduction: config.confirmedMissDeduction.work_study,
  });

  // 4. Personal Development (Weight 15)
  const personalDevBreakdown = scorePersonalDevCategory({
    maxWeight: config.weights.personal_development,
    personalDevMinutes,
    readingPages,
    dayLogs,
    activities,
    goals,
    isConfirmedMiss: confirmedMissedCategories.includes('personal_development'),
    missDeduction: config.confirmedMissDeduction.personal_development,
  });

  // 5. Daily Routine Consistency (Weight 15)
  const routineLogs = dayLogs.filter((l) => l.category === 'daily_routine');
  const routineBreakdown = scoreRoutineCategory({
    maxWeight: config.weights.daily_routine,
    dayLogs,
    routineLogs,
    sleepSession,
    isConfirmedMiss: confirmedMissedCategories.includes('daily_routine'),
    missDeduction: config.confirmedMissDeduction.daily_routine,
  });

  const categories = [
    sleepBreakdown,
    fitnessBreakdown,
    workStudyBreakdown,
    personalDevBreakdown,
    routineBreakdown,
  ];

  const positivePoints = Math.round(
    categories.reduce((sum, c) => sum + c.earnedPoints, 0) * 10
  ) / 10;
  const negativePoints = Math.round(
    categories.reduce((sum, c) => sum + c.deductedPoints, 0) * 10
  ) / 10;
  const rawTotal = positivePoints - negativePoints;
  const totalScore = Math.round(clamp(rawTotal, 0, 100));

  const activeCategories = categories.filter((c) =>
    goals.selectedCategories.includes(c.category)
  );
  const goalBasis = activeCategories.length > 0 ? activeCategories : categories;
  const goalCompletionPercent = Math.round(
    (goalBasis.reduce((sum, c) => sum + c.completionRatio, 0) / goalBasis.length) * 100
  );

  return {
    dateKey,
    totalScore,
    positivePoints: Math.round(positivePoints),
    negativePoints: Math.round(negativePoints),
    goalCompletionPercent,
    isProtectedDay: false,
    hasAnyLogs: dayLogs.length > 0 || sleepMinutes !== null,
    categories,
    sleepMinutes,
    workoutMinutes: workoutMinutes + walkingMinutes + otherFitnessMinutes,
    workStudyMinutes,
    waterMl,
    personalDevMinutes,
    routineEventsCount: routineLogs.length,
    confirmedMissedCategories,
  };
}

function resolveMissOrNotRecorded(
  category: ActivityCategory,
  maxWeight: number,
  isConfirmedMiss: boolean,
  missDeduction: number,
  notRecordedLabel: string
): CategoryScoreBreakdown {
  if (isConfirmedMiss) {
    return {
      category,
      label: CATEGORY_META[category].label,
      maxWeight,
      earnedPoints: 0,
      deductedPoints: missDeduction,
      netPoints: -missDeduction,
      completionRatio: 0,
      status: 'missed_confirmed',
      details: 'Confirmed missed goal.',
    };
  }
  return {
    category,
    label: CATEGORY_META[category].label,
    maxWeight,
    earnedPoints: 0,
    deductedPoints: 0,
    netPoints: 0,
    completionRatio: 0,
    status: 'not_recorded',
    details: notRecordedLabel,
  };
}

function scoreSleepCategory(params: {
  maxWeight: number;
  sleepSession: SleepSession;
  dayLogs: ActivityLogEntry[];
  goals: PersonalGoals;
  isConfirmedMiss: boolean;
  missDeduction: number;
}): CategoryScoreBreakdown {
  const { maxWeight, sleepSession, dayLogs, goals, isConfirmedMiss, missDeduction } = params;
  const hasWakeOrSleep =
    sleepSession.durationMinutes !== undefined ||
    dayLogs.some((l) => l.category === 'sleep_recovery');

  if (!hasWakeOrSleep) {
    return resolveMissOrNotRecorded(
      'sleep_recovery',
      maxWeight,
      isConfirmedMiss,
      missDeduction,
      'Not Recorded — log Sleep and Wake Up to track recovery.'
    );
  }

  if (sleepSession.durationMinutes === undefined) {
    // Only Wake Up or pending Sleep was logged
    const ratio = 0.25;
    const earned = Math.round(maxWeight * ratio * 10) / 10;
    return {
      category: 'sleep_recovery',
      label: CATEGORY_META.sleep_recovery.label,
      maxWeight,
      earnedPoints: earned,
      deductedPoints: 0,
      netPoints: earned,
      completionRatio: ratio,
      status: 'partial',
      details: 'Wake or Sleep timestamp recorded; pair both events for full sleep scoring.',
    };
  }

  const target = Math.max(240, goals.sleepDurationMinutes);
  const actual = sleepSession.durationMinutes;
  const diff = Math.abs(actual - target);

  // Optimal band within ±45 mins of personal target; does NOT reward oversleeping
  let ratio = 1;
  if (diff <= 45) {
    ratio = 1;
  } else if (actual < target) {
    ratio = clamp(actual / target, 0.25, 0.95);
  } else {
    // Oversleep beyond 45m gets neutral non-bonus 0.85–0.9 (not punished harshly, not rewarded extra)
    ratio = clamp(1 - (diff - 45) / 360, 0.75, 0.92);
  }

  const earned = Math.round(maxWeight * ratio * 10) / 10;
  const status: GoalRecordStatus = ratio >= 0.92 ? 'completed' : 'partial';

  return {
    category: 'sleep_recovery',
    label: CATEGORY_META.sleep_recovery.label,
    maxWeight,
    earnedPoints: earned,
    deductedPoints: 0,
    netPoints: earned,
    completionRatio: ratio,
    status,
    details: `Estimated ${formatDurationMinutes(actual)} vs ${formatDurationMinutes(target)} target.`,
  };
}

function scoreFitnessCategory(params: {
  maxWeight: number;
  workoutMinutes: number;
  walkingMinutes: number;
  waterMl: number;
  dayLogs: ActivityLogEntry[];
  goals: PersonalGoals;
  isConfirmedMiss: boolean;
  missDeduction: number;
}): CategoryScoreBreakdown {
  const {
    maxWeight,
    workoutMinutes,
    walkingMinutes,
    waterMl,
    dayLogs,
    goals,
    isConfirmedMiss,
    missDeduction,
  } = params;

  const fitnessLogs = dayLogs.filter((l) => l.category === 'health_fitness');
  if (fitnessLogs.length === 0) {
    return resolveMissOrNotRecorded(
      'health_fitness',
      maxWeight,
      isConfirmedMiss,
      missDeduction,
      'Not Recorded — no workout, walk, or hydration logs yet.'
    );
  }

  // Sub-weights inside Health & Fitness (sums to 1.0): Workout 60%, Walking 20%, Hydration 20%
  const workoutRatio =
    goals.workoutDurationMinutes > 0
      ? clamp(workoutMinutes / goals.workoutDurationMinutes, 0, 1)
      : 1;
  const walkRatio =
    goals.dailyStepOrWalkMinutes > 0
      ? clamp(walkingMinutes / goals.dailyStepOrWalkMinutes, 0, 1)
      : 1;
  const waterRatio =
    goals.waterTargetMl > 0 ? clamp(waterMl / goals.waterTargetMl, 0, 1) : 1;

  // Also acknowledge single-event fitness logs without inflating above cap
  const hasSingleFitness = fitnessLogs.some((l) => l.eventKind === 'single');
  const baseRatio = workoutRatio * 0.6 + walkRatio * 0.2 + waterRatio * 0.2;
  const combinedRatio = clamp(Math.max(baseRatio, hasSingleFitness ? 0.25 : 0), 0, 1);

  const earned = Math.round(maxWeight * combinedRatio * 10) / 10;
  const status: GoalRecordStatus = combinedRatio >= 0.85 ? 'completed' : 'partial';

  return {
    category: 'health_fitness',
    label: CATEGORY_META.health_fitness.label,
    maxWeight,
    earnedPoints: earned,
    deductedPoints: 0,
    netPoints: earned,
    completionRatio: combinedRatio,
    status,
    details: `Workout ${workoutMinutes}m/${goals.workoutDurationMinutes}m • Walk ${walkingMinutes}m • Water ${waterMl}ml/${goals.waterTargetMl}ml.`,
  };
}

function scoreWorkStudyCategory(params: {
  maxWeight: number;
  workStudyMinutes: number;
  dayLogs: ActivityLogEntry[];
  goals: PersonalGoals;
  isConfirmedMiss: boolean;
  missDeduction: number;
}): CategoryScoreBreakdown {
  const { maxWeight, workStudyMinutes, dayLogs, goals, isConfirmedMiss, missDeduction } = params;
  const focusLogs = dayLogs.filter((l) => l.category === 'work_study');

  if (focusLogs.length === 0) {
    return resolveMissOrNotRecorded(
      'work_study',
      maxWeight,
      isConfirmedMiss,
      missDeduction,
      'Not Recorded — no study or deep work sessions logged.'
    );
  }

  const target = Math.max(30, goals.workStudyDurationMinutes);
  // Capped at 1.0: extra hours do not earn extra points
  let ratio = clamp(workStudyMinutes / target, 0, 1);
  if (ratio === 0 && focusLogs.some((l) => l.eventKind === 'start' || l.eventKind === 'single')) {
    ratio = 0.15;
  }

  const earned = Math.round(maxWeight * ratio * 10) / 10;
  const status: GoalRecordStatus = ratio >= 0.9 ? 'completed' : 'partial';

  return {
    category: 'work_study',
    label: CATEGORY_META.work_study.label,
    maxWeight,
    earnedPoints: earned,
    deductedPoints: 0,
    netPoints: earned,
    completionRatio: ratio,
    status,
    details: `${formatDurationMinutes(workStudyMinutes)} focused vs ${formatDurationMinutes(target)} target.`,
  };
}

function scorePersonalDevCategory(params: {
  maxWeight: number;
  personalDevMinutes: number;
  readingPages: number;
  dayLogs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  isConfirmedMiss: boolean;
  missDeduction: number;
}): CategoryScoreBreakdown {
  const {
    maxWeight,
    personalDevMinutes,
    readingPages,
    dayLogs,
    activities,
    goals,
    isConfirmedMiss,
    missDeduction,
  } = params;

  const devLogs = dayLogs.filter((l) => l.category === 'personal_development');
  if (devLogs.length === 0) {
    return resolveMissOrNotRecorded(
      'personal_development',
      maxWeight,
      isConfirmedMiss,
      missDeduction,
      'Not Recorded — try Reading, Meditation, or a custom growth habit.'
    );
  }

  const readingDef = activities.find((a) => a.id === 'act-reading');
  const pageTarget = readingDef?.targetValue ?? 15;
  const pageRatio = pageTarget > 0 ? clamp(readingPages / pageTarget, 0, 1) : 0;
  const timeTarget = Math.max(10, goals.readingTargetMinutes);
  const timeRatio = clamp(personalDevMinutes / timeTarget, 0, 1);
  const customQtyLog = devLogs.some((l) => l.eventKind === 'single' || (l.quantity ?? 0) > 0);

  const ratio = clamp(Math.max(pageRatio, timeRatio, customQtyLog ? 0.5 : 0), 0, 1);
  const earned = Math.round(maxWeight * ratio * 10) / 10;
  const status: GoalRecordStatus = ratio >= 0.85 ? 'completed' : 'partial';

  return {
    category: 'personal_development',
    label: CATEGORY_META.personal_development.label,
    maxWeight,
    earnedPoints: earned,
    deductedPoints: 0,
    netPoints: earned,
    completionRatio: ratio,
    status,
    details:
      readingPages > 0
        ? `Read ${readingPages} pages (${personalDevMinutes}m mindfulness/other).`
        : `${personalDevMinutes}m logged in personal development.`,
  };
}

function scoreRoutineCategory(params: {
  maxWeight: number;
  dayLogs: ActivityLogEntry[];
  routineLogs: ActivityLogEntry[];
  sleepSession: SleepSession;
  isConfirmedMiss: boolean;
  missDeduction: number;
}): CategoryScoreBreakdown {
  const { maxWeight, dayLogs, routineLogs, sleepSession, isConfirmedMiss, missDeduction } = params;

  const hasWake = dayLogs.some((l) => l.activityId === 'act-wake-up') || Boolean(sleepSession.wakeTimestamp);
  const hasSleep = dayLogs.some((l) => l.activityId === 'act-sleep');
  const uniqueRoutineNames = new Set(routineLogs.map((l) => l.activityId));

  if (routineLogs.length === 0 && !hasWake && !hasSleep) {
    return resolveMissOrNotRecorded(
      'daily_routine',
      maxWeight,
      isConfirmedMiss,
      missDeduction,
      'Not Recorded — log routine anchors like Wake Up, Meals, or Sleep.'
    );
  }

  // Up to 4 distinct routine anchors (Wake Up, Breakfast, Lunch, Dinner/Sleep) — repeated identical logs don't stack
  const anchorCount =
    uniqueRoutineNames.size + (hasWake ? 1 : 0) + (hasSleep ? 1 : 0);
  const ratio = clamp(anchorCount / 4, 0, 1);
  const earned = Math.round(maxWeight * ratio * 10) / 10;
  const status: GoalRecordStatus = ratio >= 0.75 ? 'completed' : 'partial';

  return {
    category: 'daily_routine',
    label: CATEGORY_META.daily_routine.label,
    maxWeight,
    earnedPoints: earned,
    deductedPoints: 0,
    netPoints: earned,
    completionRatio: ratio,
    status,
    details: `${anchorCount} routine anchor(s) logged consistently today.`,
  };
}
