import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { streaksApi } from '../services/api';

export function useStreak() {
  return useQuery({ queryKey: ['streak'], queryFn: streaksApi.getStreak });
}

export function useStreakCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['streakCalendar', year, month],
    queryFn: () => streaksApi.getCalendar(year, month),
  });
}

export function useShields() {
  return useQuery({ queryKey: ['shields'], queryFn: streaksApi.getShields });
}

export function useUseShield() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: streaksApi.useShield,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shields'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}
