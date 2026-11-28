import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  AppHeader,
  AvatarBadge,
  LeaderboardRow,
  PrimaryButton,
} from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import {
  LeaderboardScope,
  useLeaderboard,
  useMyRank,
} from '../../src/hooks/useLeaderboard';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

type Period = 'daily' | 'weekly' | 'monthly';

interface LeaderboardItem {
  userId: string;
  name: string;
  score: number;
  avatarUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

const SCOPES: { id: LeaderboardScope; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'country', label: 'Country' },
  { id: 'state', label: 'State' },
  { id: 'city', label: 'City' },
];

export default function LeaderboardTabScreen() {
  const theme = useAppTheme();
  const [period, setPeriod] = useState<Period>('weekly');
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: leaderboardData, isLoading } = useLeaderboard(period, scope);
  const { data: myRank } = useMyRank(period, scope);

  const participants: LeaderboardItem[] = Array.isArray(leaderboardData)
    ? leaderboardData
    : (leaderboardData?.entries ?? []);
  const missingLocation = Boolean(
    !Array.isArray(leaderboardData) && leaderboardData?.missingLocation
  );
  const locationValue: string | null = !Array.isArray(leaderboardData)
    ? (leaderboardData?.locationValue ?? null)
    : null;

  const first = participants[0];
  const second = participants[1];
  const third = participants[2];

  const scopeBadgeText =
    scope === 'global'
      ? 'Global'
      : locationValue
      ? `${scope.charAt(0).toUpperCase() + scope.slice(1)}: ${locationValue}`
      : `${scope.charAt(0).toUpperCase() + scope.slice(1)} not set`;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Leaderboard"
          subtitle="Compete globally or by City, State & Country"
        />

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

        {/* Location Scope Switcher */}
        <View style={[styles.segmentBar, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
          {SCOPES.map((s) => {
            const active = scope === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setScope(s.id)}
                style={[
                  styles.segmentBtn,
                  active && { backgroundColor: theme.colors.secondaryTeal },
                ]}
              >
                <Text
                  style={[
                    styles.scopeLabel,
                    { color: active ? '#FFF' : theme.colors.primaryText },
                  ]}
                >
                  {s.label}
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
              <Text style={styles.posLabel}>
                {`Your ${period} position (${scopeBadgeText})`}
              </Text>
              <Text style={styles.posValue}>{myRank?.rank ? `Rank #${myRank.rank}` : 'Not ranked yet'}</Text>
            </View>
          </View>
          <View style={styles.posRight}>
            <Text style={styles.posScore}>{Math.round(myRank?.score ?? 0)}</Text>
            <Text style={styles.posMax}>/ 100 pts</Text>
          </View>
        </View>

        {isLoading && <ActivityIndicator color={theme.colors.secondaryTeal} style={{ marginTop: 24 }} />}

        {/* Missing Location Prompt */}
        {!isLoading && missingLocation && (
          <View
            style={[
              styles.locationPrompt,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MapPin size={22} color={theme.colors.secondaryTeal} />
            <Text style={[styles.promptTitle, { color: theme.colors.primaryText }]}>
              {`Add your ${scope} in Profile`}
            </Text>
            <Text style={[styles.promptSub, { color: theme.colors.secondaryText }]}>
              {`Set your City, State, and Country in your profile to see the ${scope} leaderboard.`}
            </Text>
            <PrimaryButton
              title="Set Location in Profile"
              onPress={() =>
                router.push({ pathname: '/setup/profile-setup', params: { mode: 'edit' } })
              }
            />
          </View>
        )}

        {/* Podium */}
        {!isLoading && !missingLocation && first && second && third && (
          <View style={styles.podiumRow}>
            <PodiumCard place={2} name={second.name} score={second.score} height={132} />
            <PodiumCard place={1} name={first.name} score={first.score} height={156} highlight />
            <PodiumCard place={3} name={third.name} score={third.score} height={122} />
          </View>
        )}

        {/* Full list */}
        {!missingLocation && (
          <View style={styles.list}>
            {participants.map((p, idx) => {
              const locLabel = [p.city, p.state, p.country].filter(Boolean).join(', ');
              return (
                <LeaderboardRow
                  key={p.userId}
                  rank={idx + 1}
                  participant={{
                    id: p.userId,
                    nickname: p.name,
                    avatarId: 'avatar-1',
                    professionLabel: locLabel,
                    isDemoUser: false,
                    currentStreak: 0,
                    dailyScore: p.score,
                    weeklyScore: p.score,
                    monthlyScore: p.score,
                    isCurrentUser: p.userId === myRank?.userId,
                  }}
                  period={period}
                />
              );
            })}
            {!isLoading && participants.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
                No leaderboard data yet for this filter. Log activities to appear here!
              </Text>
            )}
          </View>
        )}
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
  scopeLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
  positionCard: { borderRadius: RADIUS.lg, padding: SPACING.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  posLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  posLabel: { fontFamily: FONT_FAMILIES.regular, fontSize: 11, color: '#CBD5E1' },
  posValue: { fontFamily: FONT_FAMILIES.bold, fontSize: 18, color: '#FFFFFF' },
  posRight: { alignItems: 'flex-end' },
  posScore: { fontFamily: FONT_FAMILIES.bold, fontSize: 22, color: '#00A58A' },
  posMax: { fontFamily: FONT_FAMILIES.regular, fontSize: 11, color: '#CBD5E1' },
  locationPrompt: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  promptTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 16, textAlign: 'center' },
  promptSub: { fontFamily: FONT_FAMILIES.regular, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, paddingTop: SPACING.xs },
  podiumCard: { flex: 1, borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.sm, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  placePill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: RADIUS.pill },
  placeText: { fontFamily: FONT_FAMILIES.bold, fontSize: 11, color: '#FFFFFF' },
  podiumName: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
  podiumScore: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
  list: { gap: SPACING.sm },
  emptyText: { fontFamily: FONT_FAMILIES.regular, fontSize: 13, textAlign: 'center', marginTop: 24 },
});
