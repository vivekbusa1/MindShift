import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Lock, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  AppHeader,
  Calendar,
  PrimaryButton,
  RecoveryShieldCard,
  StreakCard,
} from '../../src/components';
import { ELIGIBLE_STREAK_MIN_SCORE, STREAK_MILESTONES } from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useStreak, useStreakCalendar } from '../../src/hooks/useStreaks';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { formatShortWeekday } from '../../src/utils/date';

export default function DailyStreakScreen() {
  const theme = useAppTheme();
  const now = new Date();
  const { data: streak } = useStreak();
  const { data: calendarData } = useStreakCalendar(now.getFullYear(), now.getMonth() + 1);

  const calendarDays = calendarData?.days ?? [];

  // Build 7-day week view from calendar data
  const weekDays = calendarDays.slice(-7);

  if (!streak) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppHeader title="Daily Streak" subtitle="Loading..." showBack />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const longestStreak = streak.longestStreak ?? 0;
  const currentStreak = streak.currentStreak ?? 0;
  const availableShields = streak.availableShields ?? 0;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Daily Streak"
          subtitle={`Timezone: ${streak.timezone ?? 'UTC'}`}
          showBack
        />

        <StreakCard streak={streak} />

        <View
          style={[
            styles.ruleBanner,
            {
              backgroundColor: theme.colors.tealTint,
              borderColor: theme.colors.secondaryTeal,
            },
          ]}
        >
          <Text style={[styles.ruleText, { color: theme.colors.primaryText }]}>
            Streaks grow only when you achieve meaningful daily goals (score ≥ {ELIGIBLE_STREAK_MIN_SCORE} with at least 2 logged events), never just from opening the app. Each calendar day is counted once.
          </Text>
        </View>

        {weekDays.length > 0 ? (
          <Calendar
            title="Weekly Streak Calendar"
            days={weekDays.map((d: { dateKey: string; status: string }) => ({
              dateKey: d.dateKey,
              label: formatShortWeekday(d.dateKey),
              sublabel: d.dateKey.slice(8, 10),
              status: d.status as 'completed' | 'missed' | 'protected' | 'pending',
            }))}
          />
        ) : null}

        {/* Day Totals */}
        <View style={styles.summaryRow}>
          <StatPill
            label="Completed"
            value={streak.completedDays ?? 0}
            color={theme.colors.secondaryTeal}
          />
          <StatPill
            label="Protected"
            value={streak.protectedDays ?? 0}
            color={theme.colors.primaryNavy}
          />
          <StatPill
            label="Missed"
            value={streak.missedDays ?? 0}
            color={theme.colors.error}
          />
        </View>

        <RecoveryShieldCard
          streak={streak}
          onPress={() => router.push('/streaks/shields')}
        />

        <PrimaryButton
          title="Manage Recovery Shields"
          onPress={() => router.push('/streaks/shields')}
          icon={<Shield size={18} color="#FFFFFF" />}
        />

        {/* Milestones */}
        <View
          style={[
            styles.milestoneCard,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
            Streak Milestones
          </Text>
          {STREAK_MILESTONES.map((days) => {
            const reached = longestStreak >= days;
            return (
              <View
                key={days}
                style={[
                  styles.milestoneRow,
                  {
                    backgroundColor: reached
                      ? theme.colors.successTint
                      : theme.colors.mutedSurface,
                  },
                ]}
              >
                {reached ? (
                  <CheckCircle2 size={20} color={theme.colors.success} />
                ) : (
                  <Lock size={18} color={theme.colors.secondaryText} />
                )}
                <View style={styles.milestoneInfo}>
                  <Text
                    style={[
                      styles.milestoneTitle,
                      { color: theme.colors.primaryText },
                    ]}
                  >
                    {days}-Day Consistency Milestone
                  </Text>
                  <Text
                    style={[
                      styles.milestoneSub,
                      { color: theme.colors.secondaryText },
                    ]}
                  >
                    {reached
                      ? `Achieved! Best: ${longestStreak} days`
                      : `Current streak: ${currentStreak}/${days} days`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.shieldsRow}>
          <View
            style={[
              styles.shieldPill,
              { backgroundColor: theme.colors.primaryNavy },
            ]}
          >
            <Shield size={16} color="#FFFFFF" />
            <Text style={styles.shieldCount}>{availableShields} shields available</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.statPill,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  ruleBanner: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  ruleText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 2,
  },
  statValue: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
  },
  milestoneCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  milestoneSub: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  shieldsRow: {
    alignItems: 'center',
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  shieldCount: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
