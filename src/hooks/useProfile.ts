import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, goalsApi } from '../services/api';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: profileApi.getProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function usePreferences() {
  return useQuery({ queryKey: ['preferences'], queryFn: profileApi.getPreferences });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preferences'] }),
  });
}

export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: goalsApi.getGoals });
}

export function useUpdateGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.updateGoals,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
