import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sleepApi } from '../services/api';

export function useSleepSessions() {
  return useQuery({ queryKey: ['sleepSessions'], queryFn: sleepApi.getSessions });
}

export function useSleepAnalysis() {
  return useQuery({ queryKey: ['sleepAnalysis'], queryFn: sleepApi.getAnalysis });
}

export function useLogSleep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sleepApi.logSleep,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleepSessions'] });
      qc.invalidateQueries({ queryKey: ['sleepAnalysis'] });
      qc.invalidateQueries({ queryKey: ['dailyScore'] });
    },
  });
}

export function useDeleteSleep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sleepApi.deleteSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleepSessions'] });
      qc.invalidateQueries({ queryKey: ['sleepAnalysis'] });
    },
  });
}
