import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { profileService } from './profile.service';
import { successResponse, errorResponse } from '../../types';

export const profileController = {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await profileService.getProfile(req.user!.userId);
      res.json(successResponse(profile));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch profile'));
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await profileService.updateProfile(req.user!.userId, req.body);
      res.json(successResponse(profile));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to update profile'));
    }
  },

  async getPreferences(req: AuthRequest, res: Response) {
    try {
      const prefs = await profileService.getPreferences(req.user!.userId);
      res.json(successResponse(prefs));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch preferences'));
    }
  },

  async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const prefs = await profileService.updatePreferences(req.user!.userId, req.body);
      res.json(successResponse(prefs));
    } catch {
      res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to update preferences'));
    }
  },
};
