export type ProfessionOption =
  | 'Student'
  | 'Employee'
  | 'Developer'
  | 'Business Owner'
  | 'Freelancer'
  | 'Shift Worker'
  | 'Other';

export type AgeGroup = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export type WorkloadLevel = 'light' | 'moderate' | 'heavy' | 'variable';

export type PreferredRoutine = 'early_bird' | 'balanced' | 'night_owl' | 'shift_based';

export type ActivityCategory =
  | 'sleep_recovery'
  | 'health_fitness'
  | 'work_study'
  | 'personal_development'
  | 'daily_routine';

export type TrackingType = 'single_event' | 'duration' | 'quantity';

export type RepeatFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'as_needed';

export type EventKind = 'single' | 'start' | 'end' | 'quantity';

export type ThemePreference = 'light' | 'dark';

export interface LocalAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  isDemoMode: boolean;
  hasSeenOnboarding: boolean;
  hasCompletedProfileSetup: boolean;
  hasCompletedGoalSetup: boolean;
  lastSignedInAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string;
  ageGroup: AgeGroup;
  avatarId: string;
  profession: ProfessionOption;
  customProfession: string;
  workload: WorkloadLevel;
  preferredRoutine: PreferredRoutine;
  timezone: string;
  interests: string[];
}

export interface PersonalGoals {
  selectedCategories: ActivityCategory[];
  preferredWakeTime: string; // HH:mm (24h)
  preferredBedTime: string; // HH:mm (24h)
  sleepDurationMinutes: number;
  workoutDurationMinutes: number;
  workStudyDurationMinutes: number;
  waterTargetMl: number;
  readingTargetMinutes: number;
  dailyStepOrWalkMinutes: number;
  customFocusNote: string;
}

export interface NotificationPreferences {
  morningCheckIn: boolean;
  bedtimeReminder: boolean;
  streakRiskAlert: boolean;
  weeklySummaryReady: boolean;
}

export interface PrivacySettings {
  showOnDemoLeaderboard: boolean;
  markLateEntriesClearly: boolean;
  localOnlyConfirmed: boolean;
}

export interface ScoringRuleConfig {
  mode: 'goal_completion' | 'consistency_check' | 'capped_quantity';
  maxPointsForRule: number;
  deductionOnConfirmedMiss: number;
}

export interface CustomActivityDefinition {
  id: string;
  name: string;
  aliases: string[];
  category: ActivityCategory;
  trackingType: TrackingType;
  targetValue: number;
  unit: string;
  repeatFrequency: RepeatFrequency;
  scoringRule: ScoringRuleConfig;
  isArchived: boolean;
  isDefault: boolean;
  iconName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectionHistoryEntry {
  id: string;
  previousTimestamp: string;
  newTimestamp: string;
  correctedAt: string;
  reason: string;
}

export interface ActivityLogEntry {
  id: string;
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  trackingType: TrackingType;
  eventKind: EventKind;
  pairedSessionId?: string;
  timestamp: string; // ISO timestamp of actual activity
  submittedAt: string; // ISO timestamp when user submitted
  dateKey: string; // YYYY-MM-DD in user's configured timezone
  durationMinutes?: number;
  quantity?: number;
  unit?: string;
  isLateEntry: boolean;
  isSelfReported: boolean;
  rawMessage: string;
  note?: string;
  correctionHistory: CorrectionHistoryEntry[];
}

export type SleepGoalStatus =
  | 'optimal'
  | 'below_target'
  | 'above_target'
  | 'pending_wake'
  | 'not_recorded';

export interface SleepSession {
  id: string;
  wakeDateKey: string; // YYYY-MM-DD of wake up day
  sleepTimestamp?: string;
  wakeTimestamp?: string;
  durationMinutes?: number;
  goalMinutes: number;
  status: SleepGoalStatus;
  consistencyMinutesOffset?: number;
  isEstimatedFromLogs: true;
  guidance: string;
}

export type GoalRecordStatus = 'completed' | 'partial' | 'missed_confirmed' | 'not_recorded';

export interface CategoryScoreBreakdown {
  category: ActivityCategory;
  label: string;
  maxWeight: number;
  earnedPoints: number;
  deductedPoints: number;
  netPoints: number;
  completionRatio: number; // 0..1
  status: GoalRecordStatus;
  details: string;
}

export interface DailyScoreBreakdown {
  dateKey: string;
  totalScore: number; // 0..100
  positivePoints: number;
  negativePoints: number;
  goalCompletionPercent: number;
  isProtectedDay: boolean;
  hasAnyLogs: boolean;
  categories: CategoryScoreBreakdown[];
  sleepMinutes: number | null;
  workoutMinutes: number;
  workStudyMinutes: number;
  waterMl: number;
  personalDevMinutes: number;
  routineEventsCount: number;
  confirmedMissedCategories: ActivityCategory[];
}

export type DayStreakStatus = 'completed' | 'missed' | 'protected' | 'pending' | 'empty';

export interface RecoveryShieldHistoryEntry {
  id: string;
  type: 'earned' | 'used';
  dateKey: string;
  timestamp: string;
  note: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  completedDateKeys: string[];
  protectedDateKeys: string[];
  missedDateKeys: string[];
  availableShields: number;
  shieldProgressDays: number; // 0..6 toward next 7-day shield
  lastEvaluatedDateKey: string | null;
  shieldHistory: RecoveryShieldHistoryEntry[];
}

export interface DailyReport {
  dateKey: string;
  score: DailyScoreBreakdown;
  sleepSession: SleepSession | null;
  logs: ActivityLogEntry[];
  whatWentWell: string[];
  areasForImprovement: string[];
  tomorrowSuggestions: string[];
}

export interface WeeklyReport {
  startDateKey: string;
  endDateKey: string;
  dailyScores: DailyScoreBreakdown[];
  averageScore: number;
  averageSleepMinutes: number | null;
  totalWorkoutMinutes: number;
  totalWorkStudyMinutes: number;
  goalCompletionPercent: number;
  consistencyPercent: number;
  bestDay: { dateKey: string; score: number } | null;
  frequentlyMissedGoals: { category: ActivityCategory; label: string; count: number }[];
  suggestions: string[];
}

export interface MonthlyReport {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  dailyScores: DailyScoreBreakdown[];
  weeklyComparisons: {
    weekLabel: string;
    averageScore: number;
    totalPoints: number;
    recordedDays: number;
  }[];
  averageScore: number;
  totalPoints: number;
  averageSleepMinutes: number | null;
  activityDistribution: {
    category: ActivityCategory;
    label: string;
    minutesOrCount: number;
    percent: number;
  }[];
  goalCompletionTrendPercent: number;
  suggestions: string[];
}

export interface GuidanceSection {
  category: ActivityCategory;
  title: string;
  headline: string;
  summary: string;
  tips: string[];
  dataBasis: string;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardParticipant {
  id: string;
  nickname: string;
  avatarId: string;
  professionLabel: string;
  isCurrentUser: boolean;
  isDemoUser: boolean;
  dailyScore: number;
  weeklyScore: number;
  monthlyScore: number;
  currentStreak: number;
}

export interface ParsedMessageResult {
  status:
    | 'matched_single'
    | 'matched_start'
    | 'matched_end'
    | 'matched_quantity'
    | 'unknown_activity'
    | 'invalid_input'
    | 'missing_start_session'
    | 'duplicate_entry'
    | 'already_active_session';
  message: string;
  activity?: CustomActivityDefinition;
  eventKind?: EventKind;
  quantity?: number;
  unit?: string;
  suggestedName?: string;
  activeSessionLog?: ActivityLogEntry;
  pairedDurationMinutes?: number;
}

export interface AppSettingsState {
  theme: ThemePreference;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  lateEntryWindowHours: number;
}
