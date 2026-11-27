import { useQuery } from '@tanstack/react-query';
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
