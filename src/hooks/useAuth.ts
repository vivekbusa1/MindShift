import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authApi } from '../services/api';
import { deleteStoredToken, getStoredToken, setStoredToken } from '../services/apiClient';

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: async (data) => {
      await setStoredToken('access_token', data.accessToken);
      await setStoredToken('refresh_token', data.refreshToken);
      qc.invalidateQueries({ queryKey: ['me'] });
      router.replace('/(tabs)');
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.register(email, password),
    onSuccess: async (data) => {
      await setStoredToken('access_token', data.accessToken);
      await setStoredToken('refresh_token', data.refreshToken);
      router.replace('/setup/profile-setup');
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const rt = await getStoredToken('refresh_token');
      if (rt) {
        try {
          await authApi.logout(rt);
        } catch {
          // Proceed with local logout even if server token already expired
        }
      }
    },
    onSuccess: async () => {
      await deleteStoredToken('access_token');
      await deleteStoredToken('refresh_token');
      qc.clear();
      router.replace('/auth/login');
    },
  });
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: authApi.getMe, retry: false });
}
