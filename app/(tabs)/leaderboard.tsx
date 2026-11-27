import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award } from 'lucide-react-native';
import { AppHeader, AvatarBadge, LeaderboardRow } from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useLeaderboard, useMyRank } from '../../src/hooks/useLeaderboard';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

type Period = 'daily' | 'weekly' | 'monthly';

export default function LeaderboardTabScreen() {
  const theme = useAppTheme();
  const [period, setPeriod] = useState<Period>('weekly');

  const { data: participants = [], isLoading } = useLeaderboard(period);
  const { data: myRank } = useMyRank(period);

  const first = participants[0];
  const second = participants[1];
  const third = participants[2];

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader title="Leaderboard" subtitle="Real-time ranking from your backend" />

        {/* Period Switcher */}
        <View style={[styles.segmentBar, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
          {(['daily', 'weekly', 'monthly'] as Period[]).map((tab) => {
            const active = period === tab;
            return (
              <Pressable key={tab} onPress={() => setPeriod(tab)} style={[styles.segmentBtn, active && { backgroundColor: theme.colors.primaryNavy }]}>
                <Text style={[styles.segmentLabel, { color: active ? '#FFF' : theme.colors.primaryText }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* My Position */}
        <View style={[styles.positionCard, { backgroundColor: theme.colors.primaryNavy }]}>
          <View style={styles.posLeft}>
            <Award size={22} color={theme.colors.secondaryTeal} />
            <View>
              <Text style={styles.posLabel}>Your {period} position</Text>
              <Text style={styles.posValue}>{myRank?.rank ? `Rank #${myRank.rank}` : 'Not ranked yet'}</Text>
            </View>
          </View>
          <View style={styles.posRight}>
            <Text style={styles.posScore}>{Math.round(myRank?.score ?? 0)}</Text>
            <Text style={styles.posMax}>/ 100 pts</Text>
          </View>
        </View>

        {isLoading && <ActivityIndicator color={theme.colors.secondaryTeal} style={{ marginTop: 24 }} />}

        {/* Podium */}
        {!isLoading && first && second && third && (
          <View style={styles.podiumRow}>
            <PodiumCard place={2} name={second.name} score={second.score} height={132} />
            <PodiumCard place={1} name={first.name} score={first.score} height={156} highlight />
            <PodiumCard place={3} name={third.name} score={third.score} height={122} />
          </View>
        )}

        {/* Full list */}
        <View style={styles.list}>
          {participants.map((p: { userId: string; name: string; score: number; avatarUrl?: string }, idx: number) => (
            <LeaderboardRow
              key={p.userId}
              rank={idx + 1}
              participant={{
                id: p.userId,
                nickname: p.name,
                avatarId: 'avatar-1',
                professionLabel: '',
                isDemoUser: false,
                currentStreak: 0,
                dailyScore: p.score,
                weeklyScore: p.score,
                monthlyScore: p.score,
                isCurrentUser: p.userId === myRank?.userId,
              }}
              period={period as 'daily' | 'weekly' | 'monthly'}
            />
          ))}
          {!isLoading && participants.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
              No leaderboard data yet. Log activities to appear here!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumCard({ place, name, score, height, highlight = false }: { place: 1 | 2 | 3; name: string; score: number; height: number; highlight?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.podiumCard, { minHeight: height, backgroundColor: highlight ? theme.colors.tealTint : theme.colors.white, borderColor: highlight ? theme.colors.secondaryTeal : theme.colors.border }]}>
      <View style={[styles.placePill, { backgroundColor: place === 1 ? theme.colors.secondaryTeal : theme.colors.primaryNavy }]}>
        <Text style={styles.placeText}>#{place}</Text>
      </View>
      <AvatarBadge avatarId="avatar-1" name={name} size={highlight ? 48 : 40} />
      <Text style={[styles.podiumName, { color: theme.colors.primaryText }]} numberOfLines={1}>{name}</Text>
      <Text style={[styles.podiumScore, { color: theme.colors.secondaryTeal }]}>{Math.round(score)} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxl },
  segmentBar: { flexDirection: 'row', borderRadius: RADIUS.md, borderWidth: 1, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
  positionCard: { borderRadius: RADIUS.lg, padding: SPACING.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  posLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  posLabel: { fontFamily: FONT_FAMILIES.regular, fontSize: 12, color: '#CBD5E1', textTransform: 'capitalize' },
  posValue: { fontFamily: FONT_FAMILIES.bold, fontSize: 18, color: '#FFF' },
  posRight: { alignItems: 'flex-end' },
  posScore: { fontFamily: FONT_FAMILIES.bold, fontSize: 22, color: '#FFF' },
  posMax: { fontFamily: FONT_FAMILIES.regular, fontSize: 11, color: '#CBD5E1' },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  podiumCard: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, padding: SPACING.sm, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill },
  placeText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11, color: '#FFF' },
  podiumName: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
  podiumScore: { fontFamily: FONT_FAMILIES.bold, fontSize: 13 },
  list: { gap: SPACING.sm },
  emptyText: { fontFamily: FONT_FAMILIES.regular, fontSize: 14, textAlign: 'center', marginTop: 24 },
});
