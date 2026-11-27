import { profileRepository } from './profile.repository';

export const profileService = {
  async getProfile(userId: string) {
    return profileRepository.findByUserId(userId);
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    return profileRepository.upsert(userId, data);
  },

  async getPreferences(userId: string) {
    return profileRepository.findPreferences(userId);
  },

  async updatePreferences(userId: string, data: Record<string, unknown>) {
    return profileRepository.upsertPreferences(userId, data);
  },
};
