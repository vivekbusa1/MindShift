import apiClient from './apiClient';

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }).then((r) => r.data.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data.data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data.data),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }).then((r) => r.data.data),

  getMe: () => apiClient.get('/auth/me').then((r) => r.data.data),
};

export const profileApi = {
  getProfile: () => apiClient.get('/profile').then((r) => r.data.data),
  updateProfile: (data: Record<string, unknown>) =>
    apiClient.put('/profile', data).then((r) => r.data.data),
  getPreferences: () => apiClient.get('/profile/preferences').then((r) => r.data.data),
  updatePreferences: (data: Record<string, unknown>) =>
    apiClient.put('/profile/preferences', data).then((r) => r.data.data),
};

export const goalsApi = {
  getGoals: () => apiClient.get('/goals').then((r) => r.data.data),
  updateGoals: (data: Record<string, unknown>) =>
    apiClient.put('/goals', data).then((r) => r.data.data),
};

export const activitiesApi = {
  getActivities: () => apiClient.get('/activities').then((r) => r.data.data),
  createActivity: (data: Record<string, unknown>) =>
    apiClient.post('/activities', data).then((r) => r.data.data),
  updateActivity: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/activities/${id}`, data).then((r) => r.data.data),
  deleteActivity: (id: string) =>
    apiClient.delete(`/activities/${id}`).then((r) => r.data.data),

  getLogs: (params?: Record<string, string>) =>
    apiClient.get('/activities/logs', { params }).then((r) => r.data.data),
  logActivity: (data: Record<string, unknown>) =>
    apiClient.post('/activities/logs', data).then((r) => r.data.data),
  updateLog: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/activities/logs/${id}`, data).then((r) => r.data.data),
  deleteLog: (id: string) =>
    apiClient.delete(`/activities/logs/${id}`).then((r) => r.data.data),
  parseMessage: (message: string, dateKey: string) =>
    apiClient.post('/activities/logs/parse', { message, dateKey }).then((r) => r.data.data),
};

export const sleepApi = {
  getSessions: () => apiClient.get('/sleep').then((r) => r.data.data),
  logSleep: (data: Record<string, unknown>) =>
    apiClient.post('/sleep', data).then((r) => r.data.data),
  updateSession: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/sleep/${id}`, data).then((r) => r.data.data),
  deleteSession: (id: string) =>
    apiClient.delete(`/sleep/${id}`).then((r) => r.data.data),
  getAnalysis: () => apiClient.get('/sleep/analysis').then((r) => r.data.data),
};

export const scoresApi = {
  getDaily: (dateKey?: string) =>
    apiClient.get('/scores/daily', { params: { dateKey } }).then((r) => r.data.data),
  getHistory: (startDate: string, endDate: string) =>
    apiClient.get('/scores/history', { params: { startDate, endDate } }).then((r) => r.data.data),
  recalculate: (dateKey?: string) =>
    apiClient.post('/scores/recalculate', { dateKey }).then((r) => r.data.data),
};

export const streaksApi = {
  getStreak: () => apiClient.get('/streaks').then((r) => r.data.data),
  getCalendar: (year: number, month: number) =>
    apiClient.get('/streaks/calendar', { params: { year, month } }).then((r) => r.data.data),
  getShields: () => apiClient.get('/streaks/shields').then((r) => r.data.data),
  useShield: (shieldId: string) =>
    apiClient.post('/streaks/shields/use', { shieldId }).then((r) => r.data.data),
};

export const leaderboardApi = {
  getLeaderboard: (
    period: 'daily' | 'weekly' | 'monthly',
    scope: 'global' | 'city' | 'state' | 'country' = 'global'
  ) =>
    apiClient
      .get('/leaderboard', { params: { period, scope } })
      .then((r) => r.data.data),
  getMyRank: (
    period: 'daily' | 'weekly' | 'monthly',
    scope: 'global' | 'city' | 'state' | 'country' = 'global'
  ) =>
    apiClient
      .get('/leaderboard/me', { params: { period, scope } })
      .then((r) => r.data.data),
};

export const reportsApi = {
  getDaily: (dateKey?: string) =>
    apiClient.get('/reports/daily', { params: { dateKey } }).then((r) => r.data.data),
  getWeekly: (endDate?: string) =>
    apiClient.get('/reports/weekly', { params: { endDate } }).then((r) => r.data.data),
  getMonthly: (year?: number, month?: number) =>
    apiClient.get('/reports/monthly', { params: { year, month } }).then((r) => r.data.data),
  getGuidance: () => apiClient.get('/reports/guidance').then((r) => r.data.data),
};
