import {
  ActivityCategory,
  AgeGroup,
  AppSettingsState,
  CustomActivityDefinition,
  LeaderboardParticipant,
  PersonalGoals,
  PreferredRoutine,
  ProfessionOption,
  UserProfile,
  WorkloadLevel,
} from '../types';

export const APP_NAME = 'Mindshift';
export const APP_TAGLINE = 'Track. Analyze. Improve. Repeat.';

export const STORAGE_KEYS = {
  ONBOARDING_SEEN: '@mindshift/onboarding_seen_v1',
  SETTINGS: '@mindshift/settings_v1',
} as const;

export const SCORING_WEIGHTS: Record<ActivityCategory, number> = {
  sleep_recovery: 20,
  health_fitness: 25,
  work_study: 25,
  personal_development: 15,
  daily_routine: 15,
};

export const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; shortLabel: string; weight: number; accent: string; icon: string; description: string }
> = {
  sleep_recovery: {
    label: 'Sleep & Recovery',
    shortLabel: 'Sleep',
    weight: 20,
    accent: '#071F3D',
    icon: 'Moon',
    description: 'Bedtime consistency and estimated sleep duration vs personal goal',
  },
  health_fitness: {
    label: 'Health & Fitness',
    shortLabel: 'Fitness',
    weight: 25,
    accent: '#00A58A',
    icon: 'Activity',
    description: 'Workouts, walking, hydration, and physical movement targets',
  },
  work_study: {
    label: 'Work & Study',
    shortLabel: 'Focus',
    weight: 25,
    accent: '#0E7490',
    icon: 'BookOpen',
    description: 'Deep work, study sessions, and focused productive output',
  },
  personal_development: {
    label: 'Personal Development',
    shortLabel: 'Growth',
    weight: 15,
    accent: '#16A34A',
    icon: 'Sparkles',
    description: 'Reading, journaling, mindfulness, and skill building',
  },
  daily_routine: {
    label: 'Daily Routine Consistency',
    shortLabel: 'Routine',
    weight: 15,
    accent: '#F59E0B',
    icon: 'Clock',
    description: 'Consistent wake up, meal rhythm, and sleep check-in logs',
  },
};

const BACKEND_CATEGORY_MAP: Record<string, ActivityCategory> = {
  sleep: 'sleep_recovery',
  fitness: 'health_fitness',
  productivity: 'work_study',
  nutrition: 'daily_routine',
  mindfulness: 'personal_development',
  custom: 'personal_development',
};

export function getCategoryMeta(category: string) {
  const mapped = BACKEND_CATEGORY_MAP[category] ?? (category as ActivityCategory);
  return CATEGORY_META[mapped] ?? CATEGORY_META.personal_development;
}

export const PROFESSION_OPTIONS: ProfessionOption[] = [
  'Student',
  'Employee',
  'Developer',
  'Business Owner',
  'Freelancer',
  'Shift Worker',
  'Other',
];

export const AGE_GROUPS: AgeGroup[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];

export const WORKLOAD_OPTIONS: { value: WorkloadLevel; label: string; hint: string }[] = [
  { value: 'light', label: 'Light', hint: 'Flexible schedule with lower daily pressure' },
  { value: 'moderate', label: 'Moderate', hint: 'Balanced 6–8 hour work or study blocks' },
  { value: 'heavy', label: 'Heavy', hint: 'Demanding schedule needing structured recovery' },
  { value: 'variable', label: 'Variable', hint: 'Shifting hours across weekdays or projects' },
];

export const ROUTINE_OPTIONS: { value: PreferredRoutine; label: string; hint: string }[] = [
  { value: 'early_bird', label: 'Early Bird', hint: '5:30 AM – 7:00 AM wake, early peak focus' },
  { value: 'balanced', label: 'Balanced', hint: '7:00 AM – 8:00 AM wake, steady daytime rhythm' },
  { value: 'night_owl', label: 'Night Owl', hint: 'Later start with evening creative energy' },
  { value: 'shift_based', label: 'Shift Based', hint: 'Rotating or non-standard sleep/work blocks' },
];

export const TIMEZONE_OPTIONS: string[] = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const INTEREST_OPTIONS: string[] = [
  'Fitness',
  'Better Sleep',
  'Deep Focus',
  'Reading',
  'Hydration',
  'Mindfulness',
  'Career Growth',
  'Habit Consistency',
];

export const AVATAR_OPTIONS: { id: string; label: string; bg: string; fg: string; initials: string }[] = [
  { id: 'teal-pulse', label: 'Teal Pulse', bg: '#00A58A', fg: '#FFFFFF', initials: 'MS' },
  { id: 'navy-crest', label: 'Navy Crest', bg: '#071F3D', fg: '#FFFFFF', initials: 'NC' },
  { id: 'mint-spark', label: 'Mint Spark', bg: '#D9F5EE', fg: '#071F3D', initials: 'MK' },
  { id: 'emerald-flow', label: 'Emerald Flow', bg: '#16A34A', fg: '#FFFFFF', initials: 'EF' },
  { id: 'amber-rise', label: 'Amber Rise', bg: '#F59E0B', fg: '#071F3D', initials: 'AR' },
  { id: 'slate-pro', label: 'Slate Pro', bg: '#334155', fg: '#FFFFFF', initials: 'SP' },
];

export const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;

export const ELIGIBLE_STREAK_MIN_SCORE = 60;
export const DAYS_PER_SHIELD = 7;
export const DEFAULT_LATE_ENTRY_WINDOW_HOURS = 24;

export const DEFAULT_PROFILE: UserProfile = {
  id: 'demo-user-1',
  fullName: 'Aarav Mehta',
  nickname: 'Aarav',
  ageGroup: '18-24',
  avatarId: 'teal-pulse',
  profession: 'Developer',
  customProfession: '',
  workload: 'moderate',
  preferredRoutine: 'balanced',
  timezone: 'Asia/Kolkata',
  interests: ['Fitness', 'Better Sleep', 'Deep Focus', 'Reading'],
};

export const DEFAULT_GOALS: PersonalGoals = {
  selectedCategories: [
    'sleep_recovery',
    'health_fitness',
    'work_study',
    'personal_development',
    'daily_routine',
  ],
  preferredWakeTime: '07:00',
  preferredBedTime: '23:00',
  sleepDurationMinutes: 480, // 8 hours
  workoutDurationMinutes: 45,
  workStudyDurationMinutes: 240, // 4 hours focused blocks
  waterTargetMl: 2000,
  readingTargetMinutes: 20,
  dailyStepOrWalkMinutes: 30,
  customFocusNote: 'Stay consistent with morning hydration, focused work blocks, and screen-free wind down.',
};

export const DEFAULT_SETTINGS: AppSettingsState = {
  theme: 'light',
  customTheme: {
    primaryNavy: '#071F3D',
    secondaryTeal: '#00A58A',
    lightBackground: '#E8F8F3',
    white: '#FFFFFF',
  },
  notifications: {
    morningCheckIn: true,
    bedtimeReminder: true,
    streakRiskAlert: true,
    weeklySummaryReady: true,
  },
  privacy: {
    showOnDemoLeaderboard: true,
    markLateEntriesClearly: true,
    localOnlyConfirmed: true,
  },
  lateEntryWindowHours: DEFAULT_LATE_ENTRY_WINDOW_HOURS,
};

const NOW_ISO = new Date().toISOString();

export const DEFAULT_ACTIVITIES: CustomActivityDefinition[] = [
  {
    id: 'act-wake-up',
    name: 'Wake Up',
    aliases: ['wake', 'woke up', 'wakeup', 'morning wake'],
    category: 'sleep_recovery',
    trackingType: 'single_event',
    targetValue: 1,
    unit: 'event',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'consistency_check', maxPointsForRule: 5, deductionOnConfirmedMiss: 2 },
    isArchived: false,
    isDefault: true,
    iconName: 'Sun',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-sleep',
    name: 'Sleep',
    aliases: ['bedtime', 'go to sleep', 'sleeping', 'lights out'],
    category: 'sleep_recovery',
    trackingType: 'single_event',
    targetValue: 480,
    unit: 'min',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'goal_completion', maxPointsForRule: 15, deductionOnConfirmedMiss: 4 },
    isArchived: false,
    isDefault: true,
    iconName: 'Moon',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-workout',
    name: 'Workout',
    aliases: ['gym', 'exercise', 'training', 'lift', 'cardio'],
    category: 'health_fitness',
    trackingType: 'duration',
    targetValue: 45,
    unit: 'min',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'goal_completion', maxPointsForRule: 15, deductionOnConfirmedMiss: 4 },
    isArchived: false,
    isDefault: true,
    iconName: 'Dumbbell',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-walking',
    name: 'Walking',
    aliases: ['walk', 'stroll', 'evening walk', 'morning walk'],
    category: 'health_fitness',
    trackingType: 'duration',
    targetValue: 30,
    unit: 'min',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'goal_completion', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'Footprints',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-water',
    name: 'Water',
    aliases: ['hydrate', 'hydration', 'drink water', 'water intake'],
    category: 'health_fitness',
    trackingType: 'quantity',
    targetValue: 2000,
    unit: 'ml',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'capped_quantity', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'Droplets',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-study',
    name: 'Study',
    aliases: ['deep work', 'focus', 'work', 'coding', 'revision'],
    category: 'work_study',
    trackingType: 'duration',
    targetValue: 240,
    unit: 'min',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'goal_completion', maxPointsForRule: 25, deductionOnConfirmedMiss: 5 },
    isArchived: false,
    isDefault: true,
    iconName: 'BookOpen',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-reading',
    name: 'Reading',
    aliases: ['read', 'book', 'pages'],
    category: 'personal_development',
    trackingType: 'quantity',
    targetValue: 15,
    unit: 'pages',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'capped_quantity', maxPointsForRule: 10, deductionOnConfirmedMiss: 2 },
    isArchived: false,
    isDefault: true,
    iconName: 'BookMarked',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-meditation',
    name: 'Meditation',
    aliases: ['meditate', 'breathwork', 'mindfulness', 'journal', 'journaling'],
    category: 'personal_development',
    trackingType: 'duration',
    targetValue: 15,
    unit: 'min',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'goal_completion', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'Sparkles',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-breakfast',
    name: 'Breakfast',
    aliases: ['morning meal', 'bfast'],
    category: 'daily_routine',
    trackingType: 'single_event',
    targetValue: 1,
    unit: 'event',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'consistency_check', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'Coffee',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-lunch',
    name: 'Lunch',
    aliases: ['afternoon meal'],
    category: 'daily_routine',
    trackingType: 'single_event',
    targetValue: 1,
    unit: 'event',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'consistency_check', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'Utensils',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: 'act-dinner',
    name: 'Dinner',
    aliases: ['evening meal', 'supper'],
    category: 'daily_routine',
    trackingType: 'single_event',
    targetValue: 1,
    unit: 'event',
    repeatFrequency: 'daily',
    scoringRule: { mode: 'consistency_check', maxPointsForRule: 5, deductionOnConfirmedMiss: 0 },
    isArchived: false,
    isDefault: true,
    iconName: 'UtensilsCrossed',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
];

export const QUICK_ACTIVITY_SUGGESTIONS: string[] = [
  'Wake Up',
  'Breakfast',
  'Water 250ml',
  'Study Start',
  'Study End',
  'Workout Start',
  'Workout End',
  'Lunch',
  'Walking Start',
  'Walking End',
  'Reading 10 pages',
  'Dinner',
  'Sleep',
];

export const DEMO_LEADERBOARD_BASE: Omit<
  LeaderboardParticipant,
  'isCurrentUser' | 'isDemoUser'
>[] = [
  {
    id: 'demo-p-1',
    nickname: 'Riya K.',
    avatarId: 'emerald-flow',
    professionLabel: 'Medical Student (Demo)',
    dailyScore: 91,
    weeklyScore: 88,
    monthlyScore: 86,
    currentStreak: 19,
  },
  {
    id: 'demo-p-2',
    nickname: 'Devansh P.',
    avatarId: 'navy-crest',
    professionLabel: 'Developer (Demo)',
    dailyScore: 86,
    weeklyScore: 84,
    monthlyScore: 82,
    currentStreak: 14,
  },
  {
    id: 'demo-p-3',
    nickname: 'Zoya S.',
    avatarId: 'amber-rise',
    professionLabel: 'Designer (Demo)',
    dailyScore: 79,
    weeklyScore: 81,
    monthlyScore: 78,
    currentStreak: 11,
  },
  {
    id: 'demo-p-4',
    nickname: 'Kabir N.',
    avatarId: 'mint-spark',
    professionLabel: 'Freelancer (Demo)',
    dailyScore: 74,
    weeklyScore: 72,
    monthlyScore: 75,
    currentStreak: 6,
  },
  {
    id: 'demo-p-5',
    nickname: 'Meera T.',
    avatarId: 'slate-pro',
    professionLabel: 'Analyst (Demo)',
    dailyScore: 68,
    weeklyScore: 69,
    monthlyScore: 71,
    currentStreak: 4,
  },
];
