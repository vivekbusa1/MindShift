import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../services/api';

export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => leaderboardApi.getLeaderboard(period),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMyRank(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
  return useQuery({
    queryKey: ['myRank', period],
    queryFn: () => leaderboardApi.getMyRank(period),
  });
}
