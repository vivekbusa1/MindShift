import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scoresApi } from '../services/api';

export function useDailyScore(dateKey?: string) {
  return useQuery({
    queryKey: ['dailyScore', dateKey],
    queryFn: () => scoresApi.getDaily(dateKey),
  });
}

export function useScoreHistory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['scoreHistory', startDate, endDate],
    queryFn: () => scoresApi.getHistory(startDate, endDate),
  });
}

export function useRecalculateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateKey?: string) => scoresApi.recalculate(dateKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyScore'] });
      qc.invalidateQueries({ queryKey: ['scoreHistory'] });
    },
  });
}
