import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../services/api';

export type LeaderboardScope = 'global' | 'city' | 'state' | 'country';

export function useLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  scope: LeaderboardScope = 'global'
) {
  return useQuery({
    queryKey: ['leaderboard', period, scope],
    queryFn: () => leaderboardApi.getLeaderboard(period, scope),
    staleTime: 60 * 1000,
  });
}

export function useMyRank(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  scope: LeaderboardScope = 'global'
) {
  return useQuery({
    queryKey: ['myRank', period, scope],
    queryFn: () => leaderboardApi.getMyRank(period, scope),
  });
}
