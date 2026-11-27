import { ActivityLogEntry, PersonalGoals, SleepGoalStatus, SleepSession } from '../../types';
import {
  formatDurationMinutes,
  formatMinutesAsTime12h,
  getDateKeyInTimezone,
  getMinutesOfDayInTimezone,
  parseHHMMToMinutes,
  shiftDateKey,
} from '../../utils/date';

export const SLEEP_DISCLAIMER =
  'Sleep duration is estimated from your logged Sleep and Wake Up timestamps. It does not measure clinical sleep stages or medical sleep quality.';

function isSleepLog(log: ActivityLogEntry): boolean {
  return (
    log.activityId === 'act-sleep' ||
    log.activityName.trim().toLowerCase() === 'sleep'
  );
}

function isWakeLog(log: ActivityLogEntry): boolean {
  return (
    log.activityId === 'act-wake-up' ||
    log.activityName.trim().toLowerCase() === 'wake up'
  );
}

function evaluateSleepStatus(
  durationMinutes: number,
  goalMinutes: number
): { status: SleepGoalStatus; guidance: string } {
  const diff = durationMinutes - goalMinutes;

  if (Math.abs(diff) <= 45) {
    return {
      status: 'optimal',
      guidance: `Estimated sleep (${formatDurationMinutes(durationMinutes)}) aligns closely with your ${formatDurationMinutes(goalMinutes)} goal. Keep your wind-down rhythm steady.`,
    };
  }

  if (diff < -45) {
    return {
      status: 'below_target',
      guidance: `Estimated sleep interval was ${formatDurationMinutes(Math.abs(diff))} below your ${formatDurationMinutes(goalMinutes)} target. Consider planning an earlier bedtime tonight.`,
    };
  }

  return {
    status: 'above_target',
    guidance: `Estimated sleep interval was ${formatDurationMinutes(diff)} above your ${formatDurationMinutes(goalMinutes)} target. If you felt fatigued, review your daytime recovery and wake-time consistency.`,
  };
}

function computeScheduleOffsetMinutes(
  sleepIso: string,
  wakeIso: string,
  goals: PersonalGoals,
  timezone: string
): number {
  const actualWakeMins = getMinutesOfDayInTimezone(wakeIso, timezone);
  const targetWakeMins = parseHHMMToMinutes(goals.preferredWakeTime);
  const wakeDiff = Math.abs(actualWakeMins - targetWakeMins);

  const actualBedMins = getMinutesOfDayInTimezone(sleepIso, timezone);
  const targetBedMins = parseHHMMToMinutes(goals.preferredBedTime);
  let bedDiff = Math.abs(actualBedMins - targetBedMins);
  if (bedDiff > 720) bedDiff = 1440 - bedDiff;

  return Math.round((wakeDiff + bedDiff) / 2);
}

/**
 * Reconstructs sleep sessions across days by pairing each Sleep log with the next Wake Up log.
 * Handles cross-midnight sleep (e.g., 10:00 PM Sleep -> 7:00 AM Wake Up = 9 hours).
 */
export function buildSleepSessions(
  logs: ActivityLogEntry[],
  goals: PersonalGoals,
  timezone: string
): SleepSession[] {
  const sleepAndWakeLogs = [...logs]
    .filter((l) => isSleepLog(l) || isWakeLog(l))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sessions: SleepSession[] = [];
  let pendingSleep: ActivityLogEntry | null = null;

  for (const log of sleepAndWakeLogs) {
    if (isSleepLog(log)) {
      pendingSleep = log;
      continue;
    }

    if (isWakeLog(log)) {
      const wakeDateKey = getDateKeyInTimezone(log.timestamp, timezone);

      if (pendingSleep) {
        const startMs = new Date(pendingSleep.timestamp).getTime();
        const endMs = new Date(log.timestamp).getTime();
        const durationMinutes = Math.round((endMs - startMs) / 60000);

        // Reasonable sleep pairing window: 1 hour to 18 hours
        if (durationMinutes >= 60 && durationMinutes <= 18 * 60) {
          const evalResult = evaluateSleepStatus(durationMinutes, goals.sleepDurationMinutes);
          const offset = computeScheduleOffsetMinutes(
            pendingSleep.timestamp,
            log.timestamp,
            goals,
            timezone
          );
          sessions.push({
            id: `sleep-${pendingSleep.id}-${log.id}`,
            wakeDateKey,
            sleepTimestamp: pendingSleep.timestamp,
            wakeTimestamp: log.timestamp,
            durationMinutes,
            goalMinutes: goals.sleepDurationMinutes,
            status: evalResult.status,
            consistencyMinutesOffset: offset,
            isEstimatedFromLogs: true,
            guidance: evalResult.guidance,
          });
          pendingSleep = null;
          continue;
        }
      }

      // Wake up logged without a valid preceding Sleep log
      sessions.push({
        id: `wake-only-${log.id}`,
        wakeDateKey,
        wakeTimestamp: log.timestamp,
        goalMinutes: goals.sleepDurationMinutes,
        status: 'not_recorded',
        isEstimatedFromLogs: true,
        guidance: `Wake Up logged without a paired Sleep timestamp. Log "Sleep" at bedtime (target ${formatMinutesAsTime12h(parseHHMMToMinutes(goals.preferredBedTime))}) to calculate your sleep interval.`,
      });
      pendingSleep = null;
    }
  }

  if (pendingSleep) {
    const sleepDateKey = getDateKeyInTimezone(pendingSleep.timestamp, timezone);
    const nextDayKey = shiftDateKey(sleepDateKey, 1);
    sessions.push({
      id: `pending-sleep-${pendingSleep.id}`,
      wakeDateKey: nextDayKey,
      sleepTimestamp: pendingSleep.timestamp,
      goalMinutes: goals.sleepDurationMinutes,
      status: 'pending_wake',
      isEstimatedFromLogs: true,
      guidance: 'Sleep timestamp recorded. Log "Wake Up" when you wake up to compute your estimated sleep duration.',
    });
  }

  return sessions.sort((a, b) => b.wakeDateKey.localeCompare(a.wakeDateKey));
}

export function getSleepSessionForDate(
  dateKey: string,
  sessions: SleepSession[],
  goals: PersonalGoals
): SleepSession {
  const found = sessions.find((s) => s.wakeDateKey === dateKey);
  if (found) return found;

  return {
    id: `sleep-none-${dateKey}`,
    wakeDateKey: dateKey,
    goalMinutes: goals.sleepDurationMinutes,
    status: 'not_recorded',
    isEstimatedFromLogs: true,
    guidance: 'Sleep and Wake Up were not recorded for this day.',
  };
}

export function analyzeSleepConsistency(sessions: SleepSession[]): {
  recordedCount: number;
  averageDurationMinutes: number | null;
  consistencyLabel: 'Steady' | 'Moderate' | 'Irregular' | 'Not Enough Data';
  patternNote: string;
} {
  const completed = sessions.filter(
    (s) => typeof s.durationMinutes === 'number' && s.durationMinutes > 0
  );
  if (completed.length === 0) {
    return {
      recordedCount: 0,
      averageDurationMinutes: null,
      consistencyLabel: 'Not Enough Data',
      patternNote: 'Log Sleep at night and Wake Up in the morning to see your sleep consistency trend.',
    };
  }

  const avg = Math.round(
    completed.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0) / completed.length
  );

  if (completed.length < 2) {
    return {
      recordedCount: completed.length,
      averageDurationMinutes: avg,
      consistencyLabel: 'Not Enough Data',
      patternNote: 'One sleep session recorded so far. Log a few more days to reveal your schedule consistency.',
    };
  }

  const offsets = completed
    .map((s) => s.consistencyMinutesOffset ?? 45)
    .reduce((a, b) => a + b, 0) / completed.length;

  if (offsets <= 30) {
    return {
      recordedCount: completed.length,
      averageDurationMinutes: avg,
      consistencyLabel: 'Steady',
      patternNote: 'Your bedtime and wake-up times stay within ~30 minutes of your personal targets.',
    };
  }
  if (offsets <= 60) {
    return {
      recordedCount: completed.length,
      averageDurationMinutes: avg,
      consistencyLabel: 'Moderate',
      patternNote: 'Moderate timing drift detected. Keeping wake time consistent helps anchor your routine.',
    };
  }
  return {
    recordedCount: completed.length,
    averageDurationMinutes: avg,
    consistencyLabel: 'Irregular',
    patternNote: 'Sleep timing varies across recent days. Try setting a wind-down cue 30 minutes before your bedtime target.',
  };
}
