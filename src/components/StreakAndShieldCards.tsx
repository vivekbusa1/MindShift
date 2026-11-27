import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame, Shield, Trophy } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { getNextStreakMilestone } from '../features/streaks/streakEngine';
import { StreakState } from '../types';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface StreakCardProps {
  streak: StreakState;
  onPress?: () => void;
}

export function StreakCard({ streak, onPress }: StreakCardProps) {
  const theme = useAppTheme();
  const milestone = getNextStreakMilestone(streak.currentStreak);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.statBlock}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.colors.warningTint }]}
          >
            <Flame size={20} color={theme.colors.warning} />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: theme.colors.primaryText }]}>
              {streak.currentStreak} days
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>
              Current Streak
            </Text>
          </View>
        </View>

        <View style={styles.statBlock}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.colors.tealTint }]}
          >
            <Trophy size={18} color={theme.colors.secondaryTeal} />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: theme.colors.primaryText }]}>
              {streak.longestStreak} days
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>
              Longest
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.milestoneBox}>
        <View style={styles.milestoneHeader}>
          <Text style={[styles.milestoneText, { color: theme.colors.primaryText }]}>
            Next milestone: {milestone.target} days
          </Text>
          <Text style={[styles.milestoneSub, { color: theme.colors.secondaryText }]}>
            {milestone.remaining}d left
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.mutedSurface }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${milestone.progressPercent}%`,
                backgroundColor: theme.colors.secondaryTeal,
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

interface RecoveryShieldCardProps {
  streak: StreakState;
  onPress?: () => void;
}

export function RecoveryShieldCard({ streak, onPress }: RecoveryShieldCardProps) {
  const theme = useAppTheme();
  const progressPct = Math.round((streak.shieldProgressDays / 7) * 100);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.shieldTop}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.tealTint }]}>
          <Shield size={20} color={theme.colors.secondaryTeal} />
        </View>
        <View style={styles.shieldInfo}>
          <Text style={[styles.statNumber, { color: theme.colors.primaryText }]}>
            {streak.availableShields} Recovery {streak.availableShields === 1 ? 'Shield' : 'Shields'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.secondaryText }]}>
            Protects a missed day without generating points
          </Text>
        </View>
      </View>

      <View style={styles.milestoneBox}>
        <View style={styles.milestoneHeader}>
          <Text style={[styles.milestoneText, { color: theme.colors.primaryText }]}>
            Next shield progress
          </Text>
          <Text style={[styles.milestoneSub, { color: theme.colors.secondaryText }]}>
            {streak.shieldProgressDays}/7 eligible days
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.mutedSurface }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${progressPct}%`,
                backgroundColor: theme.colors.primaryNavy,
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
  },
  statLabel: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
  milestoneBox: {
    gap: 6,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  milestoneSub: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  track: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  shieldTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shieldInfo: {
    flex: 1,
  },
});
