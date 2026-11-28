/**
 * useMindshiftStore — slim UI-state store.
 *
 * All live data (profile, goals, activities, logs, scores, streaks, leaderboard,
 * reports, sleep) is now fetched exclusively via React Query hooks in src/hooks/.
 * This store only holds app-level UI state that must persist across sessions:
 *   - hasSeenOnboarding  (AsyncStorage)
 *   - settings / theme   (AsyncStorage)
 */
import { create } from 'zustand';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import { storageService } from '../services/storageService';
import { AppSettingsState } from '../types';

interface MindshiftState {
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  settings: AppSettingsState;

  hydrate: () => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettingsState>) => Promise<void>;
}

export const useMindshiftStore = create<MindshiftState>((set, get) => ({
  isHydrated: false,
  hasSeenOnboarding: false,
  settings: DEFAULT_SETTINGS,

  async hydrate() {
    const [onboardingFlag, settings] = await Promise.all([
      storageService.getItem<boolean>(STORAGE_KEYS.ONBOARDING_SEEN),
      storageService.getItem<AppSettingsState>(STORAGE_KEYS.SETTINGS),
    ]);

    set({
      isHydrated: true,
      hasSeenOnboarding: Boolean(onboardingFlag),
      settings: settings ?? DEFAULT_SETTINGS,
    });
  },

  async markOnboardingSeen() {
    await storageService.setItem(STORAGE_KEYS.ONBOARDING_SEEN, true);
    set({ hasSeenOnboarding: true });
  },

  async updateSettings(patch) {
    const updated = { ...get().settings, ...patch };
    await storageService.setItem(STORAGE_KEYS.SETTINGS, updated);
    set({ settings: updated });
  },
}));
