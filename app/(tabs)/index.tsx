import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Flame, Moon, PlusCircle, Shield, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  ActivityMessageInput,
  ActivityTimeline,
  AvatarBadge,
  ConfirmationModal,
  InsightCard,
  PrimaryButton,
  ScoreCard,
  SecondaryButton,
} from '../../src/components';
import { CATEGORY_META } from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useActivityLogs, useLogActivity, useDeleteLog, useParseMessage, useCreateActivity } from '../../src/hooks/useActivities';
import { useDailyScore } from '../../src/hooks/useScores';
import { useStreak, useShields } from '../../src/hooks/useStreaks';
import { useProfile } from '../../src/hooks/useProfile';
import { useGuidance } from '../../src/hooks/useReports';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { ActivityCategory, TrackingType } from '../../src/types';
import {
  formatDateHeader,
  formatDurationMinutes,
  getGreetingForHour,
  getTodayDateKey,
} from '../../src/utils/date';

export default function HomeDashboardScreen() {
  const theme = useAppTheme();
  const todayKey = getTodayDateKey('UTC');

  // ── API hooks ────────────────────────────────────────────────────────────
  const { data: profile } = useProfile();
  const { data: score, isLoading: scoreLoading } = useDailyScore(todayKey);
  const { data: logs = [], isLoading: logsLoading } = useActivityLogs({ dateKey: todayKey });
  const { data: streak } = useStreak();
  const { data: shields = [] } = useShields();
  const { data: guidance } = useGuidance();
  const logActivity = useLogActivity();
  const deleteLog = useDeleteLog();
  const parseMessage = useParseMessage();
  const createActivity = useCreateActivity();

  const timezone = profile?.timezone ?? 'UTC';
  const greeting = getGreetingForHour(timezone);
  const nickName = profile?.nickname ?? profile?.fullName ?? 'Friend';

  // ── UI state ─────────────────────────────────────────────────────────────
  const [feedbackBanner, setFeedbackBanner] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [unknownPrompt, setUnknownPrompt] = useState<{ rawMessage: string; suggestedName: string; quantity?: number; unit?: string } | null>(null);
  const [newTrackingType, setNewTrackingType] = useState<TrackingType>('single_event');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('personal_development');
  const [logToDelete, setLogToDelete] = useState<Record<string, unknown> | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmitMessage = async (msg: string) => {
    try {
      const result = await parseMessage.mutateAsync({ message: msg, dateKey: todayKey });
      if (!result.parsed || result.parsed.length === 0) {
        setUnknownPrompt({ rawMessage: msg, suggestedName: msg });
        return;
      }
      for (const parsed of result.parsed) {
        await logActivity.mutateAsync({
          activityId: parsed.activityId,
          dateKey: todayKey,
          durationMin: parsed.durationMin ?? null,
          quantity: parsed.quantity ?? null,
          unit: parsed.unit ?? null,
          rawMessage: msg,
          source: 'parsed',
        });
      }
      setFeedbackBanner({ tone: 'success', text: `Logged: ${result.parsed.map((p: { activityName: string }) => p.activityName).join(', ')}` });
    } catch {
      setFeedbackBanner({ tone: 'warning', text: 'Could not parse that message. Try being more specific.' });
    }
  };

  const handleCreateAndLogUnknown = async () => {
    if (!unknownPrompt) return;
    try {
      const created = await createActivity.mutateAsync({
        name: unknownPrompt.suggestedName,
        category: newCategory,
        unit: newTrackingType === 'quantity' ? (unknownPrompt.unit ?? 'count') : newTrackingType === 'duration' ? 'min' : undefined,
        aliases: [],
      });
      await logActivity.mutateAsync({
        activityId: created.id,
        dateKey: todayKey,
        quantity: newTrackingType === 'quantity' ? (unknownPrompt.quantity ?? 1) : null,
        source: 'manual',
        rawMessage: unknownPrompt.rawMessage,
      });
      setFeedbackBanner({ tone: 'success', text: `Created "${created.name}" and logged it!` });
      setUnknownPrompt(null);
    } catch {
      setFeedbackBanner({ tone: 'warning', text: 'Failed to create activity.' });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Greeting Row */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={[styles.dateText, { color: theme.colors.secondaryText }]}>{formatDateHeader(todayKey)}</Text>
              <Text style={[styles.greetingTitle, { color: theme.colors.primaryText }]}>{greeting}, {nickName}</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <AvatarBadge avatarId={profile?.avatarId ?? 'avatar-1'} name={nickName} size={46} />
            </Pressable>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStatsRow}>
            <Pressable onPress={() => router.push('/streaks')} style={[styles.miniStatCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Flame size={18} color={theme.colors.warning} />
              <View>
                <Text style={[styles.miniStatVal, { color: theme.colors.primaryText }]}>{streak?.currentStreak ?? 0}d Streak</Text>
                <Text style={[styles.miniStatSub, { color: theme.colors.secondaryText }]}>View calendar</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/streaks/shields')} style={[styles.miniStatCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Shield size={18} color={theme.colors.secondaryTeal} />
              <View>
                <Text style={[styles.miniStatVal, { color: theme.colors.primaryText }]}>{shields.length} {shields.length === 1 ? 'Shield' : 'Shields'}</Text>
                <Text style={[styles.miniStatSub, { color: theme.colors.secondaryText }]}>Available</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/sleep')} style={[styles.miniStatCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Moon size={18} color={theme.colors.primaryNavy} />
              <View>
                <Text style={[styles.miniStatVal, { color: theme.colors.primaryText }]}>{score?.sleepScore ? `${Math.round(score.sleepScore)}%` : '--'}</Text>
                <Text style={[styles.miniStatSub, { color: theme.colors.secondaryText }]}>Sleep Score</Text>
              </View>
            </Pressable>
          </View>

          {/* Activity Logger */}
          <ActivityMessageInput onSubmitMessage={handleSubmitMessage} activeSessions={[]} />

          {feedbackBanner ? (
            <Pressable onPress={() => setFeedbackBanner(null)} style={[styles.banner, { backgroundColor: feedbackBanner.tone === 'success' ? theme.colors.successTint : theme.colors.warningTint, borderColor: feedbackBanner.tone === 'success' ? theme.colors.success : theme.colors.warning }]}>
              <Text style={[styles.bannerText, { color: theme.colors.primaryText }]}>{feedbackBanner.text}</Text>
            </Pressable>
          ) : null}

          {/* Utility Row */}
          <View style={styles.utilityRow}>
            <Pressable onPress={() => router.push('/activities/late-entry')} style={[styles.utilityBtn, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Clock size={16} color={theme.colors.secondaryTeal} />
              <Text style={[styles.utilityText, { color: theme.colors.primaryText }]}>Late Entry</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/activities/create')} style={[styles.utilityBtn, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <PlusCircle size={16} color={theme.colors.secondaryTeal} />
              <Text style={[styles.utilityText, { color: theme.colors.primaryText }]}>New Activity</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/reports/guidance')} style={[styles.utilityBtn, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Sparkles size={16} color={theme.colors.secondaryTeal} />
              <Text style={[styles.utilityText, { color: theme.colors.primaryText }]}>Guidance</Text>
            </Pressable>
          </View>

          {/* Score Card */}
          {scoreLoading ? (
            <ActivityIndicator color={theme.colors.secondaryTeal} />
          ) : score ? (
            <ScoreCard score={{
              dateKey: todayKey,
              totalScore: Math.round(score.totalScore),
              positivePoints: Math.round(score.totalScore),
              negativePoints: 0,
              isProtectedDay: false,
              hasAnyLogs: logs.length > 0,
              sleepMinutes: null,
              workoutMinutes: 0,
              workStudyMinutes: 0,
              waterMl: 0,
              personalDevMinutes: 0,
              routineEventsCount: logs.length,
              confirmedMissedCategories: [],
              goalCompletionPercent: Math.round(score.totalScore),
              categories: [
                { category: 'sleep_recovery', label: 'Sleep', maxWeight: 20, earnedPoints: score.sleepScore, deductedPoints: 0, netPoints: score.sleepScore, completionRatio: score.sleepScore / 100, status: score.sleepScore > 0 ? 'completed' : 'not_recorded', details: '' },
                { category: 'health_fitness', label: 'Fitness', maxWeight: 20, earnedPoints: score.fitnessScore, deductedPoints: 0, netPoints: score.fitnessScore, completionRatio: score.fitnessScore / 100, status: score.fitnessScore > 0 ? 'completed' : 'not_recorded', details: '' },
                { category: 'work_study', label: 'Productivity', maxWeight: 20, earnedPoints: score.productivityScore, deductedPoints: 0, netPoints: score.productivityScore, completionRatio: score.productivityScore / 100, status: score.productivityScore > 0 ? 'completed' : 'not_recorded', details: '' },
                { category: 'daily_routine', label: 'Nutrition', maxWeight: 20, earnedPoints: score.nutritionScore, deductedPoints: 0, netPoints: score.nutritionScore, completionRatio: score.nutritionScore / 100, status: score.nutritionScore > 0 ? 'completed' : 'not_recorded', details: '' },
                { category: 'personal_development', label: 'Mindfulness', maxWeight: 20, earnedPoints: score.mindfulnessScore, deductedPoints: 0, netPoints: score.mindfulnessScore, completionRatio: score.mindfulnessScore / 100, status: score.mindfulnessScore > 0 ? 'completed' : 'not_recorded', details: '' },
              ],
            }} />
          ) : null}

          {/* Insight */}
          <InsightCard
            title="Today's Focus Suggestion"
            badge="AI-powered guidance"
            body={guidance?.tips?.[0] ?? 'Log your first activity to get personalized guidance.'}
          />

          {/* Timeline */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>{`Today's Timeline (${logs.length})`}</Text>
            <Pressable onPress={() => router.push('/activities/history')}>
              <Text style={[styles.sectionLink, { color: theme.colors.secondaryTeal }]}>Full History</Text>
            </Pressable>
          </View>

          {logsLoading ? (
            <ActivityIndicator color={theme.colors.secondaryTeal} />
          ) : (
            <ActivityTimeline
              logs={logs.map((l: Record<string, unknown>) => ({
                id: l.id as string,
                activityId: l.activityId as string,
                activityName: (l.activity as { name: string })?.name ?? 'Activity',
                dateKey: l.dateKey as string,
                timestamp: l.createdAt as string,
                trackingType: l.durationMin ? 'duration' : 'single_event' as TrackingType,
                eventKind: 'single' as const,
                durationMin: l.durationMin as number | undefined,
                quantity: l.quantity as number | undefined,
                unit: l.unit as string | undefined,
                note: l.note as string | undefined,
                isLateEntry: l.isLateEntry as boolean,
                source: l.source as string,
                category: (l.activity as { category: ActivityCategory })?.category ?? 'personal_development',
              }))}
              timezone={timezone}
              onDeleteLog={(log) => setLogToDelete(log as unknown as Record<string, unknown>)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unknown Activity Modal */}
      <Modal visible={Boolean(unknownPrompt)} transparent animationType="fade" onRequestClose={() => setUnknownPrompt(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>{`Create "${unknownPrompt?.suggestedName}"?`}</Text>
            <Text style={[styles.modalSub, { color: theme.colors.secondaryText }]}>{"Mindshift didn't recognize this activity. Choose its type and category."}</Text>
            <Text style={[styles.modalLabel, { color: theme.colors.primaryText }]}>Tracking Type</Text>
            <View style={styles.modalChips}>
              {([{ id: 'single_event', label: 'Single Event' }, { id: 'duration', label: 'Duration' }, { id: 'quantity', label: 'Quantity' }] as const).map((t) => (
                <Pressable key={t.id} onPress={() => setNewTrackingType(t.id)} style={[styles.modalChip, { backgroundColor: newTrackingType === t.id ? theme.colors.secondaryTeal : theme.colors.mutedSurface }]}>
                  <Text style={{ fontFamily: FONT_FAMILIES.medium, fontSize: 12, color: newTrackingType === t.id ? '#FFF' : theme.colors.primaryText }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.modalLabel, { color: theme.colors.primaryText }]}>Category</Text>
            <View style={styles.modalChips}>
              {(Object.keys(CATEGORY_META) as ActivityCategory[]).map((cat) => (
                <Pressable key={cat} onPress={() => setNewCategory(cat)} style={[styles.modalChip, { backgroundColor: newCategory === cat ? theme.colors.primaryNavy : theme.colors.mutedSurface }]}>
                  <Text style={{ fontFamily: FONT_FAMILIES.medium, fontSize: 12, color: newCategory === cat ? '#FFF' : theme.colors.primaryText }}>{CATEGORY_META[cat].shortLabel}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <SecondaryButton title="Cancel" onPress={() => setUnknownPrompt(null)} style={styles.flex} />
              <PrimaryButton title="Create & Log" onPress={handleCreateAndLogUnknown} style={styles.flex} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={Boolean(logToDelete)}
        title="Delete Activity Log?"
        message={`Remove this activity from your timeline?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setLogToDelete(null)}
        onConfirm={async () => {
          if (logToDelete?.id) await deleteLog.mutateAsync(logToDelete.id as string);
          setLogToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxl },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  greetingText: { flex: 1 },
  dateText: { fontFamily: FONT_FAMILIES.medium, fontSize: 12 },
  greetingTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 22 },
  quickStatsRow: { flexDirection: 'row', gap: 8 },
  miniStatCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1 },
  miniStatVal: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
  miniStatSub: { fontFamily: FONT_FAMILIES.regular, fontSize: 10 },
  banner: { borderRadius: RADIUS.sm, borderWidth: 1, padding: SPACING.md },
  bannerText: { fontFamily: FONT_FAMILIES.medium, fontSize: 12, lineHeight: 18 },
  utilityRow: { flexDirection: 'row', gap: 8 },
  utilityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1 },
  utilityText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 16 },
  sectionLink: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(7,31,61,0.45)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.md },
  modalTitle: { fontFamily: FONT_FAMILIES.bold, fontSize: 18 },
  modalSub: { fontFamily: FONT_FAMILIES.regular, fontSize: 13, lineHeight: 19 },
  modalLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
});
