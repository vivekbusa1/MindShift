import { CATEGORY_META } from '../../constants';
import {
  ActivityCategory,
  ActivityLogEntry,
  CustomActivityDefinition,
  DailyReport,
  DailyScoreBreakdown,
  GuidanceSection,
  MonthlyReport,
  PersonalGoals,
  SleepSession,
  StreakState,
  WeeklyReport,
} from '../../types';
import {
  formatDurationMinutes,
  formatMonthLabel,
  getMonthDateKeys,
  getPastDateKeys,
  getTodayDateKey,
} from '../../utils/date';
import { calculateDailyScore } from '../scoring/scoringEngine';
import { getSleepSessionForDate } from '../sleep/sleepEngine';

export function buildDailyReport(params: {
  dateKey: string;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  streak: StreakState;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
}): DailyReport {
  const {
    dateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    streak,
    confirmedMissedByDate,
  } = params;

  const isProtected = streak.protectedDateKeys.includes(dateKey);
  const score = calculateDailyScore({
    dateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    confirmedMissedCategories: confirmedMissedByDate[dateKey] ?? [],
    isProtectedDay: isProtected,
  });

  const sleepSession = getSleepSessionForDate(dateKey, sleepSessions, goals);
  const dayLogs = [...logs]
    .filter((l) => l.dateKey === dateKey)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const whatWentWell: string[] = [];
  const areasForImprovement: string[] = [];
  const tomorrowSuggestions: string[] = [];

  if (isProtected) {
    whatWentWell.push('This day was protected by a Recovery Shield so your streak stayed intact.');
    tomorrowSuggestions.push('Resume your morning Wake Up and hydration anchor tomorrow to earn points again.');
    return {
      dateKey,
      score,
      sleepSession,
      logs: dayLogs,
      whatWentWell,
      areasForImprovement,
      tomorrowSuggestions,
    };
  }

  for (const cat of score.categories) {
    if (cat.status === 'completed') {
      whatWentWell.push(`${cat.label} goal was completed (${cat.earnedPoints}/${cat.maxWeight} pts).`);
    } else if (cat.status === 'partial') {
      areasForImprovement.push(
        `${cat.label} was partially completed (${cat.earnedPoints}/${cat.maxWeight} pts): ${cat.details}`
      );
    } else if (cat.status === 'missed_confirmed') {
      areasForImprovement.push(
        `${cat.label} was marked as a confirmed missed target (-${cat.deductedPoints} pts).`
      );
    } else {
      areasForImprovement.push(
        `${cat.label} is Not Recorded yet (missing logs are not treated as failure).`
      );
    }
  }

  // Specific actionable suggestions from actual data
  if (sleepSession.status === 'below_target') {
    tomorrowSuggestions.push(
      `Your estimated sleep interval (${formatDurationMinutes(sleepSession.durationMinutes)}) was below your ${formatDurationMinutes(goals.sleepDurationMinutes)} target. Consider planning an earlier bedtime tomorrow.`
    );
  } else if (sleepSession.status === 'not_recorded') {
    tomorrowSuggestions.push(
      'Log "Sleep" at bedtime and "Wake Up" in the morning to unlock estimated sleep tracking.'
    );
  }

  if (score.workoutMinutes < goals.workoutDurationMinutes) {
    const remaining = Math.max(10, goals.workoutDurationMinutes - score.workoutMinutes);
    tomorrowSuggestions.push(
      `Schedule a ${remaining}-minute movement or workout session early in the day to hit your fitness target.`
    );
  }

  if (score.workStudyMinutes < goals.workStudyDurationMinutes) {
    tomorrowSuggestions.push(
      'Try one distraction-free "Study Start" -> "Study End" block of 45 minutes tomorrow morning.'
    );
  }

  if (score.waterMl < goals.waterTargetMl) {
    tomorrowSuggestions.push(
      `Keep water nearby and log quick "Water 250ml" messages to reach your ${goals.waterTargetMl}ml target.`
    );
  }

  if (tomorrowSuggestions.length === 0) {
    tomorrowSuggestions.push(
      'Strong consistency today! Repeat your core anchors tomorrow to keep building toward your next streak milestone.'
    );
  }

  return {
    dateKey,
    score,
    sleepSession,
    logs: dayLogs,
    whatWentWell:
      whatWentWell.length > 0
        ? whatWentWell
        : ['Log your first few routine activities to highlight what went well today.'],
    areasForImprovement,
    tomorrowSuggestions,
  };
}

export function buildWeeklyReport(params: {
  endDateKey: string;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  streak: StreakState;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
}): WeeklyReport {
  const {
    endDateKey,
    logs,
    activities,
    goals,
    sleepSessions,
    streak,
    confirmedMissedByDate,
  } = params;

  const dateKeys = getPastDateKeys(endDateKey, 7);
  const dailyScores: DailyScoreBreakdown[] = dateKeys.map((key) =>
    calculateDailyScore({
      dateKey: key,
      logs,
      activities,
      goals,
      sleepSessions,
      confirmedMissedCategories: confirmedMissedByDate[key] ?? [],
      isProtectedDay: streak.protectedDateKeys.includes(key),
    })
  );

  const recordedDays = dailyScores.filter((d) => d.hasAnyLogs && !d.isProtectedDay);
  const averageScore =
    recordedDays.length > 0
      ? Math.round(recordedDays.reduce((s, d) => s + d.totalScore, 0) / recordedDays.length)
      : 0;

  const sleepDays = dailyScores.filter((d) => typeof d.sleepMinutes === 'number');
  const averageSleepMinutes =
    sleepDays.length > 0
      ? Math.round(
          sleepDays.reduce((s, d) => s + (d.sleepMinutes ?? 0), 0) / sleepDays.length
        )
      : null;

  const totalWorkoutMinutes = dailyScores.reduce((s, d) => s + d.workoutMinutes, 0);
  const totalWorkStudyMinutes = dailyScores.reduce((s, d) => s + d.workStudyMinutes, 0);

  const goalCompletionPercent =
    recordedDays.length > 0
      ? Math.round(
          recordedDays.reduce((s, d) => s + d.goalCompletionPercent, 0) / recordedDays.length
        )
      : 0;

  const consistencyPercent = Math.round((recordedDays.length / 7) * 100);

  const bestCandidate = [...recordedDays].sort((a, b) => b.totalScore - a.totalScore)[0];
  const bestDay = bestCandidate
    ? { dateKey: bestCandidate.dateKey, score: bestCandidate.totalScore }
    : null;

  const missCounts = new Map<ActivityCategory, number>();
  for (const day of recordedDays) {
    for (const cat of day.categories) {
      if (cat.status === 'missed_confirmed' || cat.completionRatio < 0.4) {
        missCounts.set(cat.category, (missCounts.get(cat.category) ?? 0) + 1);
      }
    }
  }

  const frequentlyMissedGoals = Array.from(missCounts.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_META[category].label,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const suggestions: string[] = [];
  if (consistencyPercent < 70) {
    suggestions.push(
      `You recorded activities on ${recordedDays.length} of 7 days. Aim for 2 quick check-ins daily (Wake Up & Sleep) to raise consistency.`
    );
  }
  if (averageSleepMinutes !== null && averageSleepMinutes < goals.sleepDurationMinutes - 30) {
    suggestions.push(
      `Weekly average sleep (${formatDurationMinutes(averageSleepMinutes)}) is below your ${formatDurationMinutes(goals.sleepDurationMinutes)} goal. Protect an earlier wind-down window.`
    );
  }
  if (frequentlyMissedGoals[0]) {
    suggestions.push(
      `${frequentlyMissedGoals[0].label} needed extra support on ${frequentlyMissedGoals[0].count} day(s) this week—try lowering friction or pairing it with an existing habit.`
    );
  }
  if (suggestions.length === 0) {
    suggestions.push('Balanced week across sleep, fitness, and focus! Keep maintaining your steady cadence.');
  }

  return {
    startDateKey: dateKeys[0],
    endDateKey: dateKeys[dateKeys.length - 1],
    dailyScores,
    averageScore,
    averageSleepMinutes,
    totalWorkoutMinutes,
    totalWorkStudyMinutes,
    goalCompletionPercent,
    consistencyPercent,
    bestDay,
    frequentlyMissedGoals,
    suggestions,
  };
}

export function buildMonthlyReport(params: {
  monthKey: string; // YYYY-MM
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
  streak: StreakState;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
  timezone: string;
}): MonthlyReport {
  const {
    monthKey,
    logs,
    activities,
    goals,
    sleepSessions,
    streak,
    confirmedMissedByDate,
    timezone,
  } = params;

  const todayKey = getTodayDateKey(timezone);
  const allMonthKeys = getMonthDateKeys(monthKey).filter((k) => k <= todayKey);
  const keysToEvaluate = allMonthKeys.length > 0 ? allMonthKeys : getMonthDateKeys(monthKey);

  const dailyScores = keysToEvaluate.map((key) =>
    calculateDailyScore({
      dateKey: key,
      logs,
      activities,
      goals,
      sleepSessions,
      confirmedMissedCategories: confirmedMissedByDate[key] ?? [],
      isProtectedDay: streak.protectedDateKeys.includes(key),
    })
  );

  const recordedDays = dailyScores.filter((d) => d.hasAnyLogs && !d.isProtectedDay);
  const totalPoints = dailyScores.reduce((s, d) => s + d.totalScore, 0);
  const averageScore =
    recordedDays.length > 0 ? Math.round(totalPoints / recordedDays.length) : 0;

  const sleepDays = dailyScores.filter((d) => typeof d.sleepMinutes === 'number');
  const averageSleepMinutes =
    sleepDays.length > 0
      ? Math.round(
          sleepDays.reduce((s, d) => s + (d.sleepMinutes ?? 0), 0) / sleepDays.length
        )
      : null;

  // Weekly comparisons (chunks of 7 days)
  const weeklyComparisons: MonthlyReport['weeklyComparisons'] = [];
  for (let i = 0; i < dailyScores.length; i += 7) {
    const chunk = dailyScores.slice(i, i + 7);
    const active = chunk.filter((d) => d.hasAnyLogs && !d.isProtectedDay);
    const chunkPoints = chunk.reduce((s, d) => s + d.totalScore, 0);
    weeklyComparisons.push({
      weekLabel: `Week ${Math.floor(i / 7) + 1}`,
      averageScore: active.length > 0 ? Math.round(chunkPoints / active.length) : 0,
      totalPoints: chunkPoints,
      recordedDays: active.length,
    });
  }

  // Activity distribution across categories based on month logs
  const monthLogs = logs.filter((l) => l.dateKey.startsWith(monthKey));
  const categoryTotals = new Map<ActivityCategory, number>();
  for (const log of monthLogs) {
    const value = log.durationMinutes ? log.durationMinutes : 15;
    categoryTotals.set(log.category, (categoryTotals.get(log.category) ?? 0) + value);
  }
  const grandTotal = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0) || 1;
  const activityDistribution = (Object.keys(CATEGORY_META) as ActivityCategory[]).map((cat) => {
    const val = categoryTotals.get(cat) ?? 0;
    return {
      category: cat,
      label: CATEGORY_META[cat].shortLabel,
      minutesOrCount: val,
      percent: Math.round((val / grandTotal) * 100),
    };
  });

  const goalCompletionTrendPercent =
    recordedDays.length > 0
      ? Math.round(
          recordedDays.reduce((s, d) => s + d.goalCompletionPercent, 0) / recordedDays.length
        )
      : 0;

  const suggestions: string[] = [];
  if (recordedDays.length < 7) {
    suggestions.push('Keep logging daily anchors to build a fuller monthly trend comparison.');
  } else {
    const bestWeek = [...weeklyComparisons].sort((a, b) => b.averageScore - a.averageScore)[0];
    if (bestWeek) {
      suggestions.push(
        `${bestWeek.weekLabel} was your strongest week (${bestWeek.averageScore} avg pts). Review what kept your routine steady then.`
      );
    }
  }
  if (averageSleepMinutes !== null) {
    suggestions.push(
      `Monthly average recorded sleep is ${formatDurationMinutes(averageSleepMinutes)} against your ${formatDurationMinutes(goals.sleepDurationMinutes)} personal target.`
    );
  }

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    dailyScores,
    weeklyComparisons,
    averageScore,
    totalPoints,
    averageSleepMinutes,
    activityDistribution,
    goalCompletionTrendPercent,
    suggestions,
  };
}

export function buildPersonalGuidance(params: {
  weeklyReport: WeeklyReport;
  goals: PersonalGoals;
  sleepSessions: SleepSession[];
}): GuidanceSection[] {
  const { weeklyReport, goals, sleepSessions } = params;
  const recentSleep = sleepSessions.filter((s) => s.durationMinutes !== undefined).slice(0, 7);

  return [
    {
      category: 'sleep_recovery',
      title: 'Sleep & Recovery',
      headline:
        weeklyReport.averageSleepMinutes !== null
          ? `Avg ${formatDurationMinutes(weeklyReport.averageSleepMinutes)} recorded recently`
          : 'Start logging Sleep & Wake Up',
      summary:
        'Estimated sleep intervals help you spot bedtime drift and protect next-day energy. Remember this reflects logged times, not medical sleep quality.',
      tips: [
        `Aim to wind down ~20 minutes before your ${goals.preferredBedTime} bedtime target.`,
        recentSleep.some((s) => s.status === 'below_target')
          ? 'Several recent nights fell under your target—try shifting late evening study earlier.'
          : 'Keeping a consistent Wake Up time anchors your body clock even after busy days.',
      ],
      dataBasis: `Based on ${recentSleep.length} recorded sleep session(s).`,
    },
    {
      category: 'health_fitness',
      title: 'Fitness & Hydration',
      headline: `${formatDurationMinutes(weeklyReport.totalWorkoutMinutes)} active time this week`,
      summary:
        'Steady movement and hydration matter more than occasional extreme sessions. Extra hours are capped in scoring so recovery stays respected.',
      tips: [
        `Target ${goals.workoutDurationMinutes}m workout and ${goals.dailyStepOrWalkMinutes}m walking on active days.`,
        `Pair "Water 250ml" logs with breaks between work blocks to hit ${goals.waterTargetMl}ml.`,
      ],
      dataBasis: 'Calculated from your local Workout, Walking, and Water logs.',
    },
    {
      category: 'work_study',
      title: 'Productivity & Deep Focus',
      headline: `${formatDurationMinutes(weeklyReport.totalWorkStudyMinutes)} focused this week`,
      summary:
        'Use "Study Start" and "Study End" to measure real focused duration instead of estimating at night.',
      tips: [
        `Your daily target is ${formatDurationMinutes(goals.workStudyDurationMinutes)} of deep work or study.`,
        'Break long sessions into 45–60 minute intervals with a short walk or water break.',
      ],
      dataBasis: 'Derived from paired Study / Deep Work duration sessions.',
    },
    {
      category: 'daily_routine',
      title: 'Daily Routine Rhythm',
      headline: `${weeklyReport.consistencyPercent}% logging consistency this week`,
      summary:
        'Short chat-style check-ins (Wake Up, Breakfast, Lunch, Dinner, Sleep) take seconds and create a reliable timeline.',
      tips: [
        'Use quick-tap suggestion chips on Home right after meals or transitions.',
        'If you forget a check-in, use Late Entry within 24 hours rather than skipping the day.',
      ],
      dataBasis: 'Based on your 7-day timeline activity presence.',
    },
    {
      category: 'personal_development',
      title: 'Personal Development',
      headline: 'Small daily investments compound',
      summary:
        'Reading, journaling, or mindfulness for 15 minutes daily builds long-term clarity without overwhelming your schedule.',
      tips: [
        'Log "Reading 10 pages" or "Meditation Start" / "Meditation End" right after waking or before bed.',
        'Create custom activities for any personal skill you want to practice consistently.',
      ],
      dataBasis: 'Rule-based guidance generated locally (not a medical or AI coach).',
    },
  ];
}
