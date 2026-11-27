import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../services/api';

export function useActivities() {
  return useQuery({ queryKey: ['activities'], queryFn: activitiesApi.getActivities });
}

export function useActivityLogs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['activityLogs', params],
    queryFn: () => activitiesApi.getLogs(params),
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.logActivity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activityLogs'] });
      qc.invalidateQueries({ queryKey: ['dailyScore'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
      qc.invalidateQueries({ queryKey: ['dailyReport'] });
    },
  });
}

export function useDeleteLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.deleteLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activityLogs'] });
      qc.invalidateQueries({ queryKey: ['dailyScore'] });
    },
  });
}

export function useParseMessage() {
  return useMutation({
    mutationFn: ({ message, dateKey }: { message: string; dateKey: string }) =>
      activitiesApi.parseMessage(message, dateKey),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.createActivity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activitiesApi.deleteActivity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}
