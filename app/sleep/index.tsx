import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, Moon, Sun } from 'lucide-react-native';
import {
  AppHeader,
  EmptyState,
  InsightCard,
  LoadingState,
  ProgressRing,
  SecondaryButton,
} from '../../src/components';
import { SLEEP_DISCLAIMER } from '../../src/features/sleep/sleepEngine';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useSleepAnalysis, useSleepSessions, useLogSleep } from '../../src/hooks/useSleep';
import { useGoals } from '../../src/hooks/useProfile';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import {
  formatDateHeader,
  formatDurationMinutes,
} from '../../src/utils/date';

export default function SleepTrackingScreen() {
  const theme = useAppTheme();
  const { data: sessions = [], isLoading: sessionsLoading } = useSleepSessions();
  const { data: analysis } = useSleepAnalysis();
  const { data: goals } = useGoals();
  const logSleep = useLogSleep();

  const [loggingType, setLoggingType] = useState<'sleep' | 'wake' | null>(null);

  const latestCompleted = sessions.find(
    (s: { durationMinutes?: number }) => s.durationMinutes !== undefined && s.durationMinutes > 0
  );

  const goalMins = goals?.sleepDurationMinutes ?? 480;
  const progressPct = latestCompleted?.durationMinutes
    ? Math.min(100, Math.round((latestCompleted.durationMinutes / Math.max(1, goalMins)) * 100))
    : 0;

  const handleQuickLog = (type: 'sleep' | 'wake') => {
    setLoggingType(type);
    logSleep.mutate(
      { type, timestamp: new Date().toISOString() },
      {
        onSettled: () => setLoggingType(null),
      }
    );
  };

  if (sessionsLoading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Sleep Tracking"
          subtitle="Estimated intervals from Sleep & Wake Up logs"
          showBack
        />

        {/* Explicit Estimation Disclaimer — always visible */}
        <View
          style={[
            styles.disclaimer,
            {
              backgroundColor: theme.colors.navyTint,
              borderColor: theme.colors.primaryNavy,
            },
          ]}
        >
          <Info size={18} color={theme.colors.primaryNavy} />
          <Text style={[styles.disclaimerText, { color: theme.colors.primaryText }]}>
            {SLEEP_DISCLAIMER}
          </Text>
        </View>

        {/* Latest Sleep Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
            theme.shadow,
          ]}
        >
          <View style={styles.ringRow}>
            <ProgressRing
              progress={progressPct}
              size={100}
              strokeWidth={10}
              label={
                latestCompleted?.durationMinutes
                  ? formatDurationMinutes(latestCompleted.durationMinutes)
                  : '--'
              }
              sublabel={`Goal ${formatDurationMinutes(goalMins)}`}
              color={theme.colors.primaryNavy}
            />
            <View style={styles.summaryCol}>
              <Text style={[styles.eyebrow, { color: theme.colors.secondaryTeal }]}>
                LATEST SLEEP SUMMARY
              </Text>
              <Text style={[styles.statusTitle, { color: theme.colors.primaryText }]}>
                {latestCompleted
                  ? latestCompleted.status === 'optimal'
                    ? 'On Target'
                    : latestCompleted.status === 'below_target'
                    ? 'Below Target'
                    : 'Above Target'
                  : 'No Paired Session Yet'}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.secondaryText }]}>
                Consistency: {analysis?.consistencyLabel ?? '—'}
              </Text>
            </View>
          </View>

          {latestCompleted?.sleepTime && latestCompleted?.wakeTime ? (
            <View style={styles.timesRow}>
              <View
                style={[
                  styles.timeBox,
                  { backgroundColor: theme.colors.mutedSurface },
                ]}
              >
                <Moon size={16} color={theme.colors.primaryNavy} />
                <View>
                  <Text style={[styles.timeLabel, { color: theme.colors.secondaryText }]}>
                    Bedtime Logged
                  </Text>
                  <Text style={[styles.timeVal, { color: theme.colors.primaryText }]}>
                    {new Date(latestCompleted.sleepTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.timeBox,
                  { backgroundColor: theme.colors.mutedSurface },
                ]}
              >
                <Sun size={16} color={theme.colors.secondaryTeal} />
                <View>
                  <Text style={[styles.timeLabel, { color: theme.colors.secondaryText }]}>
                    Wake Up Logged
                  </Text>
                  <Text style={[styles.timeVal, { color: theme.colors.primaryText }]}>
                    {new Date(latestCompleted.wakeTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.quickLogRow}>
            <SecondaryButton
              title="Log Bedtime"
              onPress={() => handleQuickLog('sleep')}
              loading={loggingType === 'sleep'}
              icon={<Moon size={16} color={theme.colors.primaryNavy} />}
              style={{ flex: 1 }}
            />
            <SecondaryButton
              title="Log Wake Up"
              onPress={() => handleQuickLog('wake')}
              loading={loggingType === 'wake'}
              icon={<Sun size={16} color={theme.colors.secondaryTeal} />}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {analysis?.patternNote ? (
          <InsightCard
            title="Sleep Pattern Insight"
            body={analysis.patternNote}
          />
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
          Sleep History ({sessions.length})
        </Text>

        {sessions.length === 0 ? (
          <EmptyState
            title="No sleep logs yet"
            description='Log your Bedtime and Wake Up to track your sleep intervals.'
          />
        ) : (
          sessions.map((s: {
            id: string;
            dateKey?: string;
            status?: string;
            durationMinutes?: number;
            sleepTime?: string;
            wakeTime?: string;
            guidance?: string;
          }) => (
            <View
              key={s.id}
              style={[
                styles.historyCard,
                {
                  backgroundColor: theme.colors.white,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.historyTop}>
                <Text style={[styles.historyDate, { color: theme.colors.primaryText }]}>
                  {s.dateKey ? formatDateHeader(s.dateKey) : '—'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        s.status === 'optimal'
                          ? theme.colors.successTint
                          : s.status === 'below_target'
                          ? theme.colors.warningTint
                          : theme.colors.tealTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: theme.colors.primaryText },
                    ]}
                  >
                    {s.durationMinutes
                      ? formatDurationMinutes(s.durationMinutes)
                      : 'Pending'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.historySub, { color: theme.colors.secondaryText }]}>
                {s.sleepTime
                  ? `Sleep: ${new Date(s.sleepTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Sleep: Not logged'}{' '}
                •{' '}
                {s.wakeTime
                  ? `Wake: ${new Date(s.wakeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Wake: Not logged'}
              </Text>
              {s.guidance ? (
                <Text style={[styles.historyGuidance, { color: theme.colors.secondaryText }]}>
                  {s.guidance}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  ringRow: {
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
  },
  statusTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 19,
  },
  metaText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  timesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  timeLabel: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
  timeVal: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  quickLogRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
  },
  historyCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 6,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusBadgeText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
  },
  historySub: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  historyGuidance: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
