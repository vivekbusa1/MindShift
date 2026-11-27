import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { LeaderboardParticipant, LeaderboardPeriod } from '../types';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { AvatarBadge } from './AvatarBadge';

interface LeaderboardRowProps {
  rank: number;
  participant: LeaderboardParticipant;
  period: LeaderboardPeriod;
}

export function LeaderboardRow({ rank, participant, period }: LeaderboardRowProps) {
  const theme = useAppTheme();

  const score =
    period === 'daily'
      ? participant.dailyScore
      : period === 'weekly'
      ? participant.weeklyScore
      : participant.monthlyScore;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: participant.isCurrentUser
            ? theme.colors.tealTint
            : theme.colors.white,
          borderColor: participant.isCurrentUser
            ? theme.colors.secondaryTeal
            : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.rank, { color: theme.colors.primaryText }]}>
        #{rank}
      </Text>
      <AvatarBadge
        avatarId={participant.avatarId}
        name={participant.nickname}
        size={40}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.primaryText }]}>
          {participant.nickname}
        </Text>
        <Text style={[styles.sub, { color: theme.colors.secondaryText }]}>
          {participant.professionLabel}
        </Text>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.score, { color: theme.colors.primaryText }]}>
          {score} pts
        </Text>
        <View style={styles.streakRow}>
          <Flame size={12} color={theme.colors.warning} />
          <Text style={[styles.streakText, { color: theme.colors.secondaryText }]}>
            {participant.currentStreak}d
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rank: {
    width: 30,
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 14,
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  sub: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
  },
});
