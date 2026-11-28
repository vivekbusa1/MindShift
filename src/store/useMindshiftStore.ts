import { create } from 'zustand';
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_GOALS,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from '../constants';
import { parseActivityMessage } from '../features/activities/parser';
import { localAuthService } from '../features/auth/authService';
import { buildSleepSessions } from '../features/sleep/sleepEngine';
import {
  applyRecoveryShield,
  createInitialStreakState,
  recomputeStreakState,
} from '../features/streaks/streakEngine';
import { storageService } from '../services/storageService';
import {
  ActivityCategory,
  ActivityLogEntry,
  AppSettingsState,
  AuthSession,
  CustomActivityDefinition,
  ParsedMessageResult,
  PersonalGoals,
  RepeatFrequency,
  ScoringRuleConfig,
  StreakState,
  TrackingType,
  UserProfile,
} from '../types';
import {
  createId,
  getDateKeyInTimezone,
  getTodayDateKey,
  isWithinLateEntryWindow,
} from '../utils/date';
import { generateSampleLogs } from '../utils/seedData';

interface CreateActivityInput {
  name: string;
  aliases?: string[];
  category: ActivityCategory;
  trackingType: TrackingType;
  targetValue: number;
  unit: string;
  repeatFrequency: RepeatFrequency;
  scoringRule?: ScoringRuleConfig;
  iconName?: string;
}

interface LateEntryInput {
  activityId: string;
  eventKind: 'single' | 'start' | 'end' | 'quantity';
  actualTimestampIso: string;
  endTimestampIso?: string; // optional paired end for a forgotten duration session
  quantity?: number;
  unit?: string;
  note?: string;
}

interface MindshiftState {
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  session: AuthSession | null;
  profile: UserProfile;
  goals: PersonalGoals;
  activities: CustomActivityDefinition[];
  logs: ActivityLogEntry[];
  streak: StreakState;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
  settings: AppSettingsState;

  hydrate: () => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
  loginDemo: () => Promise<void>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  registerWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;

  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  completeProfileSetup: (profileData: UserProfile) => Promise<void>;
  updateGoals: (patch: Partial<PersonalGoals>) => Promise<void>;
  completeGoalSetup: (goalsData: PersonalGoals) => Promise<void>;

  submitActivityMessage: (
    rawMessage: string,
    timestampIso?: string
  ) => Promise<{ parsed: ParsedMessageResult; createdLog?: ActivityLogEntry }>;
  submitLateEntry: (
    input: LateEntryInput
  ) => Promise<{ ok: boolean; message: string }>;
  correctActivityLog: (
    logId: string,
    newTimestampIso: string,
    reason: string
  ) => Promise<{ ok: boolean; message: string }>;
  deleteActivityLog: (logId: string) => Promise<void>;

  addCustomActivity: (input: CreateActivityInput) => Promise<CustomActivityDefinition>;
  updateCustomActivity: (
    id: string,
    patch: Partial<CustomActivityDefinition>
  ) => Promise<void>;
  archiveCustomActivity: (id: string, archived: boolean) => Promise<void>;
  deleteCustomActivity: (id: string) => Promise<void>;

  toggleConfirmedMissedCategory: (
    dateKey: string,
    category: ActivityCategory
  ) => Promise<void>;
  useRecoveryShield: (
    dateKey: string
  ) => Promise<{ success: boolean; message: string }>;

  updateSettings: (patch: Partial<AppSettingsState>) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

function recalculateStreak(params: {
  previousStreak: StreakState;
  logs: ActivityLogEntry[];
  activities: CustomActivityDefinition[];
  goals: PersonalGoals;
  confirmedMissedByDate: Record<string, ActivityCategory[]>;
  timezone: string;
}): StreakState {
  const sleepSessions = buildSleepSessions(
    params.logs,
    params.goals,
    params.timezone
  );
  return recomputeStreakState({
    previous: params.previousStreak,
    logs: params.logs,
    activities: params.activities,
    goals: params.goals,
    sleepSessions,
    confirmedMissedByDate: params.confirmedMissedByDate,
    timezone: params.timezone,
  });
}

export const useMindshiftStore = create<MindshiftState>((set, get) => ({
  isHydrated: false,
  hasSeenOnboarding: false,
  session: null,
  profile: DEFAULT_PROFILE,
  goals: DEFAULT_GOALS,
  activities: DEFAULT_ACTIVITIES,
  logs: [],
  streak: createInitialStreakState(),
  confirmedMissedByDate: {},
  settings: DEFAULT_SETTINGS,

  async hydrate() {
    const [
      session,
      profile,
      goals,
      activities,
      logs,
      streak,
      confirmedMissed,
      settings,
    ] = await Promise.all([
      storageService.getItem<AuthSession>(STORAGE_KEYS.SESSION),
      storageService.getItem<UserProfile>(STORAGE_KEYS.PROFILE),
      storageService.getItem<PersonalGoals>(STORAGE_KEYS.GOALS),
      storageService.getItem<CustomActivityDefinition[]>(STORAGE_KEYS.ACTIVITIES),
      storageService.getItem<ActivityLogEntry[]>(STORAGE_KEYS.LOGS),
      storageService.getItem<StreakState>(STORAGE_KEYS.STREAK),
      storageService.getItem<Record<string, ActivityCategory[]>>(
        STORAGE_KEYS.CONFIRMED_MISSED
      ),
      storageService.getItem<AppSettingsState>(STORAGE_KEYS.SETTINGS),
    ]);

    const resolvedProfile = profile ?? DEFAULT_PROFILE;
    const resolvedGoals = goals ?? DEFAULT_GOALS;
    const resolvedActivities =
      activities && activities.length > 0 ? activities : DEFAULT_ACTIVITIES;
    const resolvedLogs = logs ?? [];
    const resolvedMissed = confirmedMissed ?? {};
    const resolvedSettings = settings ?? DEFAULT_SETTINGS;

    const computedStreak = recalculateStreak({
      previousStreak: streak ?? createInitialStreakState(),
      logs: resolvedLogs,
      activities: resolvedActivities,
      goals: resolvedGoals,
      confirmedMissedByDate: resolvedMissed,
      timezone: resolvedProfile.timezone,
    });

    set({
      isHydrated: true,
      hasSeenOnboarding: Boolean(session?.hasSeenOnboarding),
      session,
      profile: resolvedProfile,
      goals: resolvedGoals,
      activities: resolvedActivities,
      logs: resolvedLogs,
      streak: computedStreak,
      confirmedMissedByDate: resolvedMissed,
      settings: resolvedSettings,
    });
  },

  async markOnboardingSeen() {
    const current = get().session;
    if (current) {
      const updated = { ...current, hasSeenOnboarding: true };
      await storageService.setItem(STORAGE_KEYS.SESSION, updated);
      set({ session: updated, hasSeenOnboarding: true });
    } else {
      set({ hasSeenOnboarding: true });
    }
  },

  async loginDemo() {
    const profile = { ...DEFAULT_PROFILE };
    const goals = { ...DEFAULT_GOALS };
    const activities = [...DEFAULT_ACTIVITIES];
    const sampleLogs = generateSampleLogs(profile, goals);
    const initialStreak = createInitialStreakState();
    const computedStreak = recalculateStreak({
      previousStreak: initialStreak,
      logs: sampleLogs,
      activities,
      goals,
      confirmedMissedByDate: {},
      timezone: profile.timezone,
    });

    const demoSession: AuthSession = {
      userId: profile.id,
      email: 'demo@mindshift.app',
      isDemoMode: true,
      hasSeenOnboarding: true,
      hasCompletedProfileSetup: true,
      hasCompletedGoalSetup: true,
      lastSignedInAt: new Date().toISOString(),
    };

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.SESSION, demoSession),
      storageService.setItem(STORAGE_KEYS.PROFILE, profile),
      storageService.setItem(STORAGE_KEYS.GOALS, goals),
      storageService.setItem(STORAGE_KEYS.ACTIVITIES, activities),
      storageService.setItem(STORAGE_KEYS.LOGS, sampleLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, computedStreak),
      storageService.setItem(STORAGE_KEYS.CONFIRMED_MISSED, {}),
    ]);

    set({
      session: demoSession,
      hasSeenOnboarding: true,
      profile,
      goals,
      activities,
      logs: sampleLogs,
      streak: computedStreak,
      confirmedMissedByDate: {},
    });
  },

  async loginWithEmail(email, password) {
    const res = await localAuthService.signInLocalAccount({ email, password });
    if (!res.ok) return res;

    // Ensure activities exist for local account
    const currentActivities = get().activities;
    if (currentActivities.length === 0) {
      await storageService.setItem(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES);
    }

    set({
      session: res.session,
      hasSeenOnboarding: true,
    });
    return { ok: true };
  },

  async registerWithEmail(email, password) {
    const res = await localAuthService.registerLocalAccount({ email, password });
    if (!res.ok) return res;

    const freshProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      id: res.session.userId,
      fullName: '',
      nickname: '',
    };
    const freshGoals: PersonalGoals = { ...DEFAULT_GOALS };
    const freshStreak = createInitialStreakState();

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.PROFILE, freshProfile),
      storageService.setItem(STORAGE_KEYS.GOALS, freshGoals),
      storageService.setItem(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES),
      storageService.setItem(STORAGE_KEYS.LOGS, []),
      storageService.setItem(STORAGE_KEYS.STREAK, freshStreak),
      storageService.setItem(STORAGE_KEYS.CONFIRMED_MISSED, {}),
    ]);

    set({
      session: res.session,
      hasSeenOnboarding: true,
      profile: freshProfile,
      goals: freshGoals,
      activities: DEFAULT_ACTIVITIES,
      logs: [],
      streak: freshStreak,
      confirmedMissedByDate: {},
    });

    return { ok: true };
  },

  async logout() {
    await storageService.removeItem(STORAGE_KEYS.SESSION);
    set({ session: null });
  },

  async updateProfile(patch) {
    const updated = { ...get().profile, ...patch };
    await storageService.setItem(STORAGE_KEYS.PROFILE, updated);
    const computedStreak = recalculateStreak({
      previousStreak: get().streak,
      logs: get().logs,
      activities: get().activities,
      goals: get().goals,
      confirmedMissedByDate: get().confirmedMissedByDate,
      timezone: updated.timezone,
    });
    await storageService.setItem(STORAGE_KEYS.STREAK, computedStreak);
    set({ profile: updated, streak: computedStreak });
  },

  async completeProfileSetup(profileData) {
    const session = get().session;
    const updatedSession = session
      ? { ...session, hasCompletedProfileSetup: true }
      : null;

    await storageService.setItem(STORAGE_KEYS.PROFILE, profileData);
    if (updatedSession) {
      await storageService.setItem(STORAGE_KEYS.SESSION, updatedSession);
    }

    set({
      profile: profileData,
      session: updatedSession,
    });
  },

  async updateGoals(patch) {
    const updated = { ...get().goals, ...patch };
    await storageService.setItem(STORAGE_KEYS.GOALS, updated);
    const computedStreak = recalculateStreak({
      previousStreak: get().streak,
      logs: get().logs,
      activities: get().activities,
      goals: updated,
      confirmedMissedByDate: get().confirmedMissedByDate,
      timezone: get().profile.timezone,
    });
    await storageService.setItem(STORAGE_KEYS.STREAK, computedStreak);
    set({ goals: updated, streak: computedStreak });
  },

  async completeGoalSetup(goalsData) {
    const session = get().session;
    const updatedSession = session
      ? { ...session, hasCompletedGoalSetup: true }
      : null;

    await storageService.setItem(STORAGE_KEYS.GOALS, goalsData);
    if (updatedSession) {
      await storageService.setItem(STORAGE_KEYS.SESSION, updatedSession);
    }

    const computedStreak = recalculateStreak({
      previousStreak: get().streak,
      logs: get().logs,
      activities: get().activities,
      goals: goalsData,
      confirmedMissedByDate: get().confirmedMissedByDate,
      timezone: get().profile.timezone,
    });
    await storageService.setItem(STORAGE_KEYS.STREAK, computedStreak);

    set({
      goals: goalsData,
      session: updatedSession,
      streak: computedStreak,
    });
  },

  async submitActivityMessage(rawMessage, timestampIso) {
    const { activities, logs, profile, goals, streak, confirmedMissedByDate } =
      get();
    const nowIso = timestampIso ?? new Date().toISOString();
    const parsed = parseActivityMessage(rawMessage, activities, logs, nowIso);

    if (
      !parsed.activity ||
      !parsed.eventKind ||
      (parsed.status !== 'matched_single' &&
        parsed.status !== 'matched_start' &&
        parsed.status !== 'matched_end' &&
        parsed.status !== 'matched_quantity')
    ) {
      return { parsed };
    }

    const createdLog: ActivityLogEntry = {
      id: createId('log'),
      activityId: parsed.activity.id,
      activityName: parsed.activity.name,
      category: parsed.activity.category,
      trackingType: parsed.activity.trackingType,
      eventKind: parsed.eventKind,
      pairedSessionId: parsed.activeSessionLog?.id,
      timestamp: nowIso,
      submittedAt: new Date().toISOString(),
      dateKey: getDateKeyInTimezone(nowIso, profile.timezone),
      durationMinutes: parsed.pairedDurationMinutes,
      quantity: parsed.quantity,
      unit: parsed.unit,
      isLateEntry: false,
      isSelfReported: true,
      rawMessage: rawMessage.trim(),
      correctionHistory: [],
    };

    const nextLogs = [...logs, createdLog];
    const nextStreak = recalculateStreak({
      previousStreak: streak,
      logs: nextLogs,
      activities,
      goals,
      confirmedMissedByDate,
      timezone: profile.timezone,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.LOGS, nextLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
    ]);

    set({ logs: nextLogs, streak: nextStreak });
    return { parsed, createdLog };
  },

  async submitLateEntry(input) {
    const {
      activities,
      logs,
      profile,
      goals,
      streak,
      confirmedMissedByDate,
      settings,
    } = get();

    const activity = activities.find((a) => a.id === input.activityId);
    if (!activity) {
      return { ok: false, message: 'Selected activity could not be found.' };
    }

    const check = isWithinLateEntryWindow(
      input.actualTimestampIso,
      settings.lateEntryWindowHours
    );
    if (!check.valid) {
      return { ok: false, message: check.reason ?? 'Invalid timestamp.' };
    }

    const nowIso = new Date().toISOString();
    const actualMs = new Date(input.actualTimestampIso).getTime();

    // If user entered a full forgotten duration session (Start + End together)
    if (activity.trackingType === 'duration' && input.endTimestampIso) {
      const endCheck = isWithinLateEntryWindow(
        input.endTimestampIso,
        settings.lateEntryWindowHours
      );
      if (!endCheck.valid) {
        return { ok: false, message: endCheck.reason ?? 'Invalid end timestamp.' };
      }

      const endMs = new Date(input.endTimestampIso).getTime();
      if (endMs <= actualMs) {
        return {
          ok: false,
          message: 'End time must be after start time (impossible duration prevented).',
        };
      }
      const durationMinutes = Math.round((endMs - actualMs) / 60000);
      if (durationMinutes > 18 * 60) {
        return {
          ok: false,
          message: 'Duration exceeds 18 hours. Please check your start and end timestamps.',
        };
      }

      // Check overlapping duplicate sessions
      const overlapping = logs.some((l) => {
        if (l.activityId !== activity.id || l.eventKind !== 'start') return false;
        return Math.abs(new Date(l.timestamp).getTime() - actualMs) < 5 * 60000;
      });
      if (overlapping) {
        return {
          ok: false,
          message: `A "${activity.name}" session already exists around that time.`,
        };
      }

      const startId = createId('log');
      const startLog: ActivityLogEntry = {
        id: startId,
        activityId: activity.id,
        activityName: activity.name,
        category: activity.category,
        trackingType: 'duration',
        eventKind: 'start',
        timestamp: input.actualTimestampIso,
        submittedAt: nowIso,
        dateKey: getDateKeyInTimezone(input.actualTimestampIso, profile.timezone),
        isLateEntry: true,
        isSelfReported: true,
        rawMessage: `${activity.name} Start (Late Entry)`,
        note: input.note,
        correctionHistory: [],
      };

      const endLog: ActivityLogEntry = {
        id: createId('log'),
        activityId: activity.id,
        activityName: activity.name,
        category: activity.category,
        trackingType: 'duration',
        eventKind: 'end',
        pairedSessionId: startId,
        timestamp: input.endTimestampIso,
        submittedAt: nowIso,
        dateKey: getDateKeyInTimezone(input.endTimestampIso, profile.timezone),
        durationMinutes,
        isLateEntry: true,
        isSelfReported: true,
        rawMessage: `${activity.name} End (Late Entry)`,
        note: input.note,
        correctionHistory: [],
      };

      const nextLogs = [...logs, startLog, endLog];
      const nextStreak = recalculateStreak({
        previousStreak: streak,
        logs: nextLogs,
        activities,
        goals,
        confirmedMissedByDate,
        timezone: profile.timezone,
      });

      await Promise.all([
        storageService.setItem(STORAGE_KEYS.LOGS, nextLogs),
        storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
      ]);
      set({ logs: nextLogs, streak: nextStreak });
      return {
        ok: true,
        message: `Recorded late ${activity.name} session (${durationMinutes} min) as self-reported.`,
      };
    }

    // Single, Start, End, or Quantity late entry
    const duplicate = logs.some(
      (l) =>
        l.activityId === activity.id &&
        l.eventKind === input.eventKind &&
        Math.abs(new Date(l.timestamp).getTime() - actualMs) < 2 * 60000
    );
    if (duplicate) {
      return {
        ok: false,
        message: `A similar "${activity.name}" entry already exists within 2 minutes of that time.`,
      };
    }

    let pairedSessionId: string | undefined;
    let durationMinutes: number | undefined;
    if (input.eventKind === 'end') {
      const openStart = [...logs]
        .filter((l) => l.activityId === activity.id && l.eventKind === 'start')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (!openStart) {
        return {
          ok: false,
          message: `No prior "${activity.name} Start" found. Log both Start and End times together.`,
        };
      }
      const startMs = new Date(openStart.timestamp).getTime();
      if (actualMs <= startMs) {
        return {
          ok: false,
          message: 'End time must be after the active start timestamp.',
        };
      }
      pairedSessionId = openStart.id;
      durationMinutes = Math.round((actualMs - startMs) / 60000);
    }

    const newLog: ActivityLogEntry = {
      id: createId('log'),
      activityId: activity.id,
      activityName: activity.name,
      category: activity.category,
      trackingType: activity.trackingType,
      eventKind: input.eventKind,
      pairedSessionId,
      timestamp: input.actualTimestampIso,
      submittedAt: nowIso,
      dateKey: getDateKeyInTimezone(input.actualTimestampIso, profile.timezone),
      durationMinutes,
      quantity: input.eventKind === 'quantity' ? input.quantity ?? 1 : undefined,
      unit: input.eventKind === 'quantity' ? input.unit ?? activity.unit : undefined,
      isLateEntry: true,
      isSelfReported: true,
      rawMessage: `${activity.name} (Late Entry)`,
      note: input.note,
      correctionHistory: [],
    };

    const nextLogs = [...logs, newLog];
    const nextStreak = recalculateStreak({
      previousStreak: streak,
      logs: nextLogs,
      activities,
      goals,
      confirmedMissedByDate,
      timezone: profile.timezone,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.LOGS, nextLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
    ]);
    set({ logs: nextLogs, streak: nextStreak });
    return {
      ok: true,
      message: `Late entry saved for ${activity.name} (marked self-reported).`,
    };
  },

  async correctActivityLog(logId, newTimestampIso, reason) {
    const {
      logs,
      activities,
      profile,
      goals,
      streak,
      confirmedMissedByDate,
      settings,
    } = get();

    const target = logs.find((l) => l.id === logId);
    if (!target) {
      return { ok: false, message: 'Log entry not found.' };
    }

    const check = isWithinLateEntryWindow(
      newTimestampIso,
      settings.lateEntryWindowHours
    );
    if (!check.valid) {
      return { ok: false, message: check.reason ?? 'Invalid correction timestamp.' };
    }

    const nowIso = new Date().toISOString();
    const newMs = new Date(newTimestampIso).getTime();

    // Validate paired duration constraints if this log is an end or start
    let updatedDuration = target.durationMinutes;
    if (target.eventKind === 'end' && target.pairedSessionId) {
      const startLog = logs.find((l) => l.id === target.pairedSessionId);
      if (startLog) {
        const startMs = new Date(startLog.timestamp).getTime();
        if (newMs <= startMs) {
          return {
            ok: false,
            message: 'Corrected end time cannot be earlier than its paired start time.',
          };
        }
        updatedDuration = Math.max(1, Math.round((newMs - startMs) / 60000));
      }
    }

    const nextLogs = logs.map((l) => {
      if (l.id === logId) {
        return {
          ...l,
          timestamp: newTimestampIso,
          submittedAt: nowIso,
          dateKey: getDateKeyInTimezone(newTimestampIso, profile.timezone),
          durationMinutes: updatedDuration,
          isLateEntry: true,
          isSelfReported: true,
          correctionHistory: [
            ...l.correctionHistory,
            {
              id: createId('corr'),
              previousTimestamp: l.timestamp,
              newTimestamp: newTimestampIso,
              correctedAt: nowIso,
              reason: reason.trim() || 'Time corrected by user',
            },
          ],
        };
      }
      // If we edited a start log, recalculate its paired end log duration too
      if (l.pairedSessionId === logId) {
        const endMs = new Date(l.timestamp).getTime();
        if (endMs > newMs) {
          return {
            ...l,
            durationMinutes: Math.max(1, Math.round((endMs - newMs) / 60000)),
          };
        }
      }
      return l;
    });

    const nextStreak = recalculateStreak({
      previousStreak: streak,
      logs: nextLogs,
      activities,
      goals,
      confirmedMissedByDate,
      timezone: profile.timezone,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.LOGS, nextLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
    ]);
    set({ logs: nextLogs, streak: nextStreak });
    return {
      ok: true,
      message: 'Timestamp corrected and marked as self-reported.',
    };
  },

  async deleteActivityLog(logId) {
    const { logs, activities, goals, streak, confirmedMissedByDate, profile } = get();
    const nextLogs = logs.filter((l) => l.id !== logId && l.pairedSessionId !== logId);
    const nextStreak = recalculateStreak({
      previousStreak: streak,
      logs: nextLogs,
      activities,
      goals,
      confirmedMissedByDate,
      timezone: profile.timezone,
    });
    await Promise.all([
      storageService.setItem(STORAGE_KEYS.LOGS, nextLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
    ]);
    set({ logs: nextLogs, streak: nextStreak });
  },

  async addCustomActivity(input) {
    const nowIso = new Date().toISOString();
    const created: CustomActivityDefinition = {
      id: createId('act'),
      name: input.name.trim(),
      aliases: input.aliases ?? [],
      category: input.category,
      trackingType: input.trackingType,
      targetValue: input.targetValue,
      unit: input.unit.trim() || 'count',
      repeatFrequency: input.repeatFrequency,
      scoringRule: input.scoringRule ?? {
        mode:
          input.trackingType === 'quantity'
            ? 'capped_quantity'
            : input.trackingType === 'duration'
            ? 'goal_completion'
            : 'consistency_check',
        maxPointsForRule: 5,
        deductionOnConfirmedMiss: 0,
      },
      isArchived: false,
      isDefault: false,
      iconName: input.iconName ?? 'CheckCircle2',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const next = [...get().activities, created];
    await storageService.setItem(STORAGE_KEYS.ACTIVITIES, next);
    set({ activities: next });
    return created;
  },

  async updateCustomActivity(id, patch) {
    const next = get().activities.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
    );
    await storageService.setItem(STORAGE_KEYS.ACTIVITIES, next);
    set({ activities: next });
  },

  async archiveCustomActivity(id, archived) {
    await get().updateCustomActivity(id, { isArchived: archived });
  },

  async deleteCustomActivity(id) {
    const next = get().activities.filter((a) => a.id !== id);
    await storageService.setItem(STORAGE_KEYS.ACTIVITIES, next);
    set({ activities: next });
  },

  async toggleConfirmedMissedCategory(dateKey, category) {
    const current = { ...get().confirmedMissedByDate };
    const existing = current[dateKey] ?? [];
    const nextList = existing.includes(category)
      ? existing.filter((c) => c !== category)
      : [...existing, category];
    current[dateKey] = nextList;

    const nextStreak = recalculateStreak({
      previousStreak: get().streak,
      logs: get().logs,
      activities: get().activities,
      goals: get().goals,
      confirmedMissedByDate: current,
      timezone: get().profile.timezone,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.CONFIRMED_MISSED, current),
      storageService.setItem(STORAGE_KEYS.STREAK, nextStreak),
    ]);
    set({ confirmedMissedByDate: current, streak: nextStreak });
  },

  async useRecoveryShield(dateKey) {
    const todayKey = getTodayDateKey(get().profile.timezone);
    const result = applyRecoveryShield(get().streak, dateKey, todayKey);
    if (!result.success || !result.updated) {
      return { success: false, message: result.message };
    }

    const recomputed = recalculateStreak({
      previousStreak: result.updated,
      logs: get().logs,
      activities: get().activities,
      goals: get().goals,
      confirmedMissedByDate: get().confirmedMissedByDate,
      timezone: get().profile.timezone,
    });

    await storageService.setItem(STORAGE_KEYS.STREAK, recomputed);
    set({ streak: recomputed });
    return { success: true, message: result.message };
  },

  async updateSettings(patch) {
    const next: AppSettingsState = {
      ...get().settings,
      ...patch,
      customTheme: patch.customTheme
        ? {
            ...(get().settings.customTheme ?? DEFAULT_SETTINGS.customTheme!),
            ...patch.customTheme,
          }
        : get().settings.customTheme,
      notifications: {
        ...get().settings.notifications,
        ...(patch.notifications ?? {}),
      },
      privacy: {
        ...get().settings.privacy,
        ...(patch.privacy ?? {}),
      },
    };
    await storageService.setItem(STORAGE_KEYS.SETTINGS, next);
    set({ settings: next });
  },

  async resetDemoData() {
    const profile = { ...DEFAULT_PROFILE };
    const goals = { ...DEFAULT_GOALS };
    const activities = [...DEFAULT_ACTIVITIES];
    const sampleLogs = generateSampleLogs(profile, goals);
    const streak = recalculateStreak({
      previousStreak: createInitialStreakState(),
      logs: sampleLogs,
      activities,
      goals,
      confirmedMissedByDate: {},
      timezone: profile.timezone,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.PROFILE, profile),
      storageService.setItem(STORAGE_KEYS.GOALS, goals),
      storageService.setItem(STORAGE_KEYS.ACTIVITIES, activities),
      storageService.setItem(STORAGE_KEYS.LOGS, sampleLogs),
      storageService.setItem(STORAGE_KEYS.STREAK, streak),
      storageService.setItem(STORAGE_KEYS.CONFIRMED_MISSED, {}),
      storageService.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
    ]);

    set({
      profile,
      goals,
      activities,
      logs: sampleLogs,
      streak,
      confirmedMissedByDate: {},
      settings: DEFAULT_SETTINGS,
    });
  },
}));
