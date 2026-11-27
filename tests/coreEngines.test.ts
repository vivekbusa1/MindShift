import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ACTIVITIES, DEFAULT_GOALS } from '../src/constants';
import { parseActivityMessage } from '../src/features/activities/parser';
import { calculateDailyScore } from '../src/features/scoring/scoringEngine';
import { buildSleepSessions } from '../src/features/sleep/sleepEngine';
import {
  applyRecoveryShield,
  createInitialStreakState,
  recomputeStreakState,
} from '../src/features/streaks/streakEngine';
import { ActivityLogEntry } from '../src/types';
import { isWithinLateEntryWindow } from '../src/utils/date';

test('parser handles single event, start/end duration, quantity, and unknown activities', () => {
  const logs: ActivityLogEntry[] = [];

  const wake = parseActivityMessage('wake up', DEFAULT_ACTIVITIES, logs, '2026-11-27T01:30:00.000Z');
  assert.equal(wake.status, 'matched_single');
  assert.equal(wake.activity?.id, 'act-wake-up');

  const water = parseActivityMessage('Water 250ml', DEFAULT_ACTIVITIES, logs, '2026-11-27T02:00:00.000Z');
  assert.equal(water.status, 'matched_quantity');
  assert.equal(water.quantity, 250);
  assert.equal(water.unit, 'ml');

  const startWorkout = parseActivityMessage('gym start', DEFAULT_ACTIVITIES, logs, '2026-11-27T03:00:00.000Z');
  assert.equal(startWorkout.status, 'matched_start');
  assert.equal(startWorkout.activity?.id, 'act-workout');

  const missingStart = parseActivityMessage('Study End', DEFAULT_ACTIVITIES, logs, '2026-11-27T04:00:00.000Z');
  assert.equal(missingStart.status, 'missing_start_session');

  const activeLogs: ActivityLogEntry[] = [
    {
      id: 'log-1',
      activityId: 'act-workout',
      activityName: 'Workout',
      category: 'health_fitness',
      trackingType: 'duration',
      eventKind: 'start',
      timestamp: '2026-11-27T03:00:00.000Z',
      submittedAt: '2026-11-27T03:00:00.000Z',
      dateKey: '2026-11-27',
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: 'Workout Start',
      correctionHistory: [],
    },
  ];

  const endWorkout = parseActivityMessage(
    'Workout End',
    DEFAULT_ACTIVITIES,
    activeLogs,
    '2026-11-27T03:45:00.000Z'
  );
  assert.equal(endWorkout.status, 'matched_end');
  assert.equal(endWorkout.pairedDurationMinutes, 45);

  const unknown = parseActivityMessage('Piano Practice', DEFAULT_ACTIVITIES, logs);
  assert.equal(unknown.status, 'unknown_activity');
});

test('sleep engine pairs Sleep -> Wake Up across midnight accurately', () => {
  const logs: ActivityLogEntry[] = [
    {
      id: 's1',
      activityId: 'act-sleep',
      activityName: 'Sleep',
      category: 'sleep_recovery',
      trackingType: 'single_event',
      eventKind: 'single',
      timestamp: '2026-11-26T22:00:00.000Z',
      submittedAt: '2026-11-26T22:00:00.000Z',
      dateKey: '2026-11-26',
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: 'Sleep',
      correctionHistory: [],
    },
    {
      id: 'w1',
      activityId: 'act-wake-up',
      activityName: 'Wake Up',
      category: 'sleep_recovery',
      trackingType: 'single_event',
      eventKind: 'single',
      timestamp: '2026-11-27T07:00:00.000Z',
      submittedAt: '2026-11-27T07:00:00.000Z',
      dateKey: '2026-11-27',
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: 'Wake Up',
      correctionHistory: [],
    },
  ];

  const sessions = buildSleepSessions(logs, DEFAULT_GOALS, 'UTC');
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].durationMinutes, 540); // 9 hours
  assert.equal(sessions[0].wakeDateKey, '2026-11-27');
});

test('scoring engine marks unlogged categories as not_recorded, caps extra workout, and zeros protected days', () => {
  const logs: ActivityLogEntry[] = [
    {
      id: 'w-end',
      activityId: 'act-workout',
      activityName: 'Workout',
      category: 'health_fitness',
      trackingType: 'duration',
      eventKind: 'end',
      durationMinutes: 240, // 4 hours workout (well above 45m goal)
      timestamp: '2026-11-27T08:00:00.000Z',
      submittedAt: '2026-11-27T08:00:00.000Z',
      dateKey: '2026-11-27',
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: 'Workout End',
      correctionHistory: [],
    },
  ];

  const score = calculateDailyScore({
    dateKey: '2026-11-27',
    logs,
    activities: DEFAULT_ACTIVITIES,
    goals: DEFAULT_GOALS,
    sleepSessions: [],
  });

  const fitness = score.categories.find((c) => c.category === 'health_fitness');
  const focus = score.categories.find((c) => c.category === 'work_study');

  // Extra workout duration cannot exceed category cap (or sub-weight)
  assert.ok((fitness?.earnedPoints ?? 0) <= 25);
  assert.equal(focus?.status, 'not_recorded');
  assert.equal(focus?.deductedPoints, 0);

  const protectedScore = calculateDailyScore({
    dateKey: '2026-11-27',
    logs,
    activities: DEFAULT_ACTIVITIES,
    goals: DEFAULT_GOALS,
    sleepSessions: [],
    isProtectedDay: true,
  });
  assert.equal(protectedScore.totalScore, 0);
  assert.equal(protectedScore.isProtectedDay, true);
});

test('recovery shield protects missed day once and prevents duplicate redemption', () => {
  const initial = createInitialStreakState();
  const res1 = applyRecoveryShield(initial, '2026-11-25', '2026-11-27');
  assert.equal(res1.success, true);
  assert.equal(res1.updated?.availableShields, 0);
  assert.ok(res1.updated?.protectedDateKeys.includes('2026-11-25'));

  const res2 = applyRecoveryShield(
    { ...res1.updated!, availableShields: 2 },
    '2026-11-25',
    '2026-11-27'
  );
  assert.equal(res2.success, false);

  const recomputed = recomputeStreakState({
    previous: initial,
    logs: [],
    activities: DEFAULT_ACTIVITIES,
    goals: DEFAULT_GOALS,
    sleepSessions: [],
    confirmedMissedByDate: {},
    timezone: 'UTC',
  });
  assert.equal(recomputed.currentStreak, 0);
});

test('late entry validation rejects future timestamps and >24h entries', () => {
  const nowMs = new Date('2026-11-27T10:00:00.000Z').getTime();

  const future = isWithinLateEntryWindow('2026-11-27T11:00:00.000Z', 24, nowMs);
  assert.equal(future.valid, false);

  const tooOld = isWithinLateEntryWindow('2026-11-25T09:00:00.000Z', 24, nowMs);
  assert.equal(tooOld.valid, false);

  const valid = isWithinLateEntryWindow('2026-11-27T07:00:00.000Z', 24, nowMs);
  assert.equal(valid.valid, true);
});
