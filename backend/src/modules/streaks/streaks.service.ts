import { streaksRepository } from './streaks.repository';

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];
const MIN_SCORE_FOR_ACTIVE = 30; // score needed to count as an active day

export const streaksService = {
  async getStreak(userId: string) {
    return streaksRepository.findByUserId(userId);
  },

  async updateStreak(userId: string) {
    const existing = await streaksRepository.findByUserId(userId);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let currentStreak = existing?.currentStreak ?? 0;
    let longestStreak = existing?.longestStreak ?? 0;
    const milestones = existing?.milestones ?? [];

    if (existing?.lastActiveDate === today) {
      return existing; // already updated today
    }

    if (existing?.lastActiveDate === yesterday) {
      currentStreak += 1;
    } else if (existing?.lastActiveDate !== today) {
      // Check if a shield covers the gap
      const shields = await streaksRepository.getShields(userId);
      if (shields.length > 0) {
        await streaksRepository.useShield(shields[0].id, userId);
        currentStreak += 1; // shield protected the streak
      } else {
        currentStreak = 1; // streak broken, restart
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Award milestones
    for (const m of MILESTONES) {
      if (currentStreak >= m && !milestones.includes(m)) {
        milestones.push(m);
        // Award a shield for hitting milestones
        if ([7, 30, 90].includes(m)) {
          await streaksRepository.awardShield(userId, `${m}-day milestone`);
        }
      }
    }

    return streaksRepository.upsert(userId, {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      milestones,
    });
  },

  async getCalendar(userId: string, year: number, month: number) {
    const days = await streaksRepository.getCalendar(userId, year, month);
    return days.map((d) => ({
      dateKey: d.dateKey,
      active: d.totalScore >= MIN_SCORE_FOR_ACTIVE,
      score: d.totalScore,
    }));
  },

  async getShields(userId: string) {
    return streaksRepository.getShields(userId);
  },

  async useShield(userId: string, shieldId: string) {
    return streaksRepository.useShield(shieldId, userId);
  },
};
