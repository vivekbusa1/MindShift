import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { DailyScoreBreakdown } from '../types';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { ProgressRing } from './ProgressRing';

interface ScoreCardProps {
  score: DailyScoreBreakdown;
  onPressDetails?: () => void;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.topRow}>
        <ProgressRing
          progress={score.totalScore}
          size={98}
          strokeWidth={10}
          label={`${score.totalScore}`}
          sublabel="/ 100"
          color={
            score.isProtectedDay
              ? theme.colors.warning
              : score.totalScore >= 75
              ? theme.colors.secondaryTeal
              : score.totalScore >= 50
              ? theme.colors.primaryNavy
              : theme.colors.warning
          }
        />
        <View style={styles.summaryCol}>
          <Text style={[styles.eyebrow, { color: theme.colors.secondaryTeal }]}>
            {score.isProtectedDay ? 'RECOVERY SHIELD ACTIVE' : "TODAY'S LIFESTYLE SCORE"}
          </Text>
          <Text style={[styles.headline, { color: theme.colors.primaryText }]}>
            {score.isProtectedDay
              ? 'Streak Protected'
              : score.totalScore >= 80
              ? 'Strong Momentum'
              : score.totalScore >= 60
              ? 'Steady Progress'
              : score.hasAnyLogs
              ? 'Building Up'
              : 'Ready to Log'}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.secondaryText }]}>
            {score.isProtectedDay
              ? 'Protected days preserve your streak without generating points.'
              : `${score.goalCompletionPercent}% goal progress • +${score.positivePoints} pts / -${score.negativePoints} pts`}
          </Text>
        </View>
      </View>

      <View style={styles.barList}>
        {score.categories.map((cat) => {
          const pct = Math.round((cat.earnedPoints / Math.max(1, cat.maxWeight)) * 100);
          return (
            <View key={cat.category} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={[styles.barLabel, { color: theme.colors.primaryText }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.barValue, { color: theme.colors.secondaryText }]}>
                  {cat.status === 'not_recorded'
                    ? 'Not Recorded'
                    : `${cat.earnedPoints}/${cat.maxWeight}`}
                </Text>
              </View>
              <View
                style={[styles.track, { backgroundColor: theme.colors.mutedSurface }]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${pct}%`,
                      backgroundColor:
                        cat.status === 'completed'
                          ? theme.colors.secondaryTeal
                          : cat.status === 'missed_confirmed'
                          ? theme.colors.error
                          : theme.colors.primaryNavy,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  summaryCol: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 18,
  },
  meta: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  barList: {
    gap: 8,
  },
  barItem: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  barValue: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
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
});
