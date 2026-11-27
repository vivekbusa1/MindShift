import { DEFAULT_ACTIVITIES, DEFAULT_GOALS, DEFAULT_PROFILE } from '../constants';
import { ActivityLogEntry, PersonalGoals, UserProfile } from '../types';
import { createId, getDateKeyInTimezone, getTodayDateKey, shiftDateKey } from '../utils/date';

/**
 * Generates realistic multi-day sample logs in the user's timezone so
 * daily/weekly/monthly reports, sleep tracking, streaks, and leaderboard
 * work immediately out of the box and can be reset anytime.
 */
export function generateSampleLogs(
  profile: UserProfile = DEFAULT_PROFILE,
  goals: PersonalGoals = DEFAULT_GOALS
): ActivityLogEntry[] {
  const tz = profile.timezone || 'Asia/Kolkata';
  const todayKey = getTodayDateKey(tz);
  const logs: ActivityLogEntry[] = [];

  const makeTimestamp = (dateKey: string, hour: number, minute: number): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    // Construct approximate local timestamp anchored cleanly for the dateKey
    const utc = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
    // Shift by rough offset so dateKey in timezone matches reliably
    const probeKey = getDateKeyInTimezone(utc, tz);
    if (probeKey !== dateKey) {
      const diffHours = probeKey > dateKey ? -6 : 6;
      utc.setUTCHours(utc.getUTCHours() + diffHours);
    }
    return utc.toISOString();
  };

  const pushSingle = (
    dateKey: string,
    activityId: string,
    activityName: string,
    category: ActivityLogEntry['category'],
    hour: number,
    minute: number,
    rawMessage: string
  ) => {
    const ts = makeTimestamp(dateKey, hour, minute);
    logs.push({
      id: createId('log'),
      activityId,
      activityName,
      category,
      trackingType: 'single_event',
      eventKind: 'single',
      timestamp: ts,
      submittedAt: ts,
      dateKey: getDateKeyInTimezone(ts, tz),
      isLateEntry: false,
      isSelfReported: true,
      rawMessage,
      correctionHistory: [],
    });
  };

  const pushDurationPair = (
    dateKey: string,
    activityId: string,
    activityName: string,
    category: ActivityLogEntry['category'],
    startHour: number,
    startMin: number,
    durationMinutes: number
  ) => {
    const startTs = makeTimestamp(dateKey, startHour, startMin);
    const endDate = new Date(new Date(startTs).getTime() + durationMinutes * 60000);
    const endTs = endDate.toISOString();
    const startId = createId('log');

    logs.push({
      id: startId,
      activityId,
      activityName,
      category,
      trackingType: 'duration',
      eventKind: 'start',
      timestamp: startTs,
      submittedAt: startTs,
      dateKey: getDateKeyInTimezone(startTs, tz),
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: `${activityName} Start`,
      correctionHistory: [],
    });

    logs.push({
      id: createId('log'),
      activityId,
      activityName,
      category,
      trackingType: 'duration',
      eventKind: 'end',
      pairedSessionId: startId,
      timestamp: endTs,
      submittedAt: endTs,
      dateKey: getDateKeyInTimezone(endTs, tz),
      durationMinutes,
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: `${activityName} End`,
      correctionHistory: [],
    });
  };

  const pushQuantity = (
    dateKey: string,
    activityId: string,
    activityName: string,
    category: ActivityLogEntry['category'],
    hour: number,
    minute: number,
    quantity: number,
    unit: string
  ) => {
    const ts = makeTimestamp(dateKey, hour, minute);
    logs.push({
      id: createId('log'),
      activityId,
      activityName,
      category,
      trackingType: 'quantity',
      eventKind: 'quantity',
      timestamp: ts,
      submittedAt: ts,
      dateKey: getDateKeyInTimezone(ts, tz),
      quantity,
      unit,
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: `${activityName} ${quantity}${unit === 'ml' ? 'ml' : ` ${unit}`}`,
      correctionHistory: [],
    });
  };

  // Seed past 6 days + today (leave 1 day lighter so user can test streaks/shields)
  for (let offset = 6; offset >= 1; offset--) {
    const dayKey = shiftDateKey(todayKey, -offset);
    const prevDayKey = shiftDateKey(dayKey, -1);

    // Night before sleep -> morning wake up
    const sleepHour = offset % 2 === 0 ? 17 : 18; // ~22:30-23:30 IST / UTC adjusted
    pushSingle(prevDayKey, 'act-sleep', 'Sleep', 'sleep_recovery', sleepHour, 15, 'Sleep');
    pushSingle(dayKey, 'act-wake-up', 'Wake Up', 'sleep_recovery', 1, 30 + (offset % 3) * 10, 'Wake Up');
    pushSingle(dayKey, 'act-breakfast', 'Breakfast', 'daily_routine', 2, 30, 'Breakfast');

    if (offset !== 2) {
      pushDurationPair(
        dayKey,
        'act-workout',
        'Workout',
        'health_fitness',
        3,
        0,
        goals.workoutDurationMinutes
      );
      pushQuantity(dayKey, 'act-water', 'Water', 'health_fitness', 5, 0, 1000, 'ml');
      pushQuantity(dayKey, 'act-water', 'Water', 'health_fitness', 10, 0, 750, 'ml');
      pushDurationPair(
        dayKey,
        'act-study',
        'Study',
        'work_study',
        6,
        0,
        Math.min(goals.workStudyDurationMinutes, 180)
      );
      pushQuantity(dayKey, 'act-reading', 'Reading', 'personal_development', 14, 0, 15, 'pages');
      pushSingle(dayKey, 'act-lunch', 'Lunch', 'daily_routine', 7, 30, 'Lunch');
      pushSingle(dayKey, 'act-dinner', 'Dinner', 'daily_routine', 14, 30, 'Dinner');
    } else {
      // Lighter day 2 days ago to demonstrate missed/recovery shield behavior
      pushQuantity(dayKey, 'act-water', 'Water', 'health_fitness', 6, 0, 500, 'ml');
    }
  }

  // Seed today's morning check-in + last night sleep so dashboard looks alive immediately
  const yesterdayKey = shiftDateKey(todayKey, -1);
  pushSingle(yesterdayKey, 'act-sleep', 'Sleep', 'sleep_recovery', 17, 30, 'Sleep');
  pushSingle(todayKey, 'act-wake-up', 'Wake Up', 'sleep_recovery', 1, 45, 'Wake Up');
  pushSingle(todayKey, 'act-breakfast', 'Breakfast', 'daily_routine', 2, 30, 'Breakfast');
  pushQuantity(todayKey, 'act-water', 'Water', 'health_fitness', 3, 15, 500, 'ml');
  pushDurationPair(todayKey, 'act-study', 'Study', 'work_study', 4, 0, 90);

  // Ensure all referenced activities exist in default activities
  void DEFAULT_ACTIVITIES;

  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
