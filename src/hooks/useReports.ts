import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/api';

export function useDailyReport(dateKey?: string) {
  return useQuery({
    queryKey: ['dailyReport', dateKey],
    queryFn: () => reportsApi.getDaily(dateKey),
  });
}

export function useWeeklyReport(endDate?: string) {
  return useQuery({
    queryKey: ['weeklyReport', endDate],
    queryFn: () => reportsApi.getWeekly(endDate),
  });
}

export function useMonthlyReport(year?: number, month?: number) {
  return useQuery({
    queryKey: ['monthlyReport', year, month],
    queryFn: () => reportsApi.getMonthly(year, month),
  });
}

export function useGuidance() {
  return useQuery({ queryKey: ['guidance'], queryFn: reportsApi.getGuidance });
}
