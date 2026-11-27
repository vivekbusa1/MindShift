import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppHeader, ReportChart, SecondaryButton } from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useDailyReport, useWeeklyReport, useMonthlyReport } from '../../src/hooks/useReports';
import { useScoreHistory } from '../../src/hooks/useScores';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { formatDateHeader, formatShortWeekday, getTodayDateKey, shiftDateKey } from '../../src/utils/date';

type ReportTab = 'daily' | 'weekly' | 'monthly';

export default function ReportsTabScreen() {
  const theme = useAppTheme();
  const todayKey = getTodayDateKey('UTC');
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: dailyReport, isLoading: dailyLoading } = useDailyReport(selectedDateKey);
  const { data: weeklyReport, isLoading: weeklyLoading } = useWeeklyReport(todayKey);
  const { data: monthlyReport, isLoading: monthlyLoading } = useMonthlyReport(year, month);

  // 7-day score history for weekly chart
  const startDate = shiftDateKey(todayKey, -6);
  const { data: scoreHistory = [] } = useScoreHistory(startDate, todayKey);

  const isLoading = dailyLoading || weeklyLoading || monthlyLoading;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Performance Reports"
          subtitle="Calculated from your backend activity data"
          rightSlot={
            <Pressable onPress={() => router.push('/reports/guidance')} style={[styles.guidanceBtn, { backgroundColor: theme.colors.tealTint }]}>
              <Sparkles size={15} color={theme.colors.secondaryTeal} />
              <Text style={[styles.guidanceText, { color: theme.colors.primaryText }]}>Guidance</Text>
            </Pressable>
          }
        />

        {/* Tab Switcher */}
        <View style={[styles.segmentBar, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
          {(['daily', 'weekly', 'monthly'] as ReportTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.segmentBtn, active && { backgroundColor: theme.colors.primaryNavy }]}>
                <Text style={[styles.segmentLabel, { color: active ? '#FFF' : theme.colors.primaryText }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading && <ActivityIndicator color={theme.colors.secondaryTeal} style={{ marginTop: 32 }} />}

        {/* ── DAILY ── */}
        {activeTab === 'daily' && !dailyLoading && (
          <>
            <View style={[styles.dateNav, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Pressable onPress={() => setSelectedDateKey((d) => shiftDateKey(d, -1))} style={styles.navArrow}>
                <ChevronLeft size={20} color={theme.colors.primaryText} />
              </Pressable>
              <Text style={[styles.dateTitle, { color: theme.colors.primaryText }]}>
                {selectedDateKey === todayKey ? `Today • ${formatDateHeader(selectedDateKey)}` : formatDateHeader(selectedDateKey)}
              </Text>
              <Pressable disabled={selectedDateKey >= todayKey} onPress={() => setSelectedDateKey((d) => shiftDateKey(d, 1))} style={[styles.navArrow, selectedDateKey >= todayKey && { opacity: 0.35 }]}>
                <ChevronRight size={20} color={theme.colors.primaryText} />
              </Pressable>
            </View>

            <View style={styles.metricGrid}>
              <MetricTile label="Total Score" value={`${Math.round(dailyReport?.score?.totalScore ?? 0)} / 100`} />
              <MetricTile label="Sleep Score" value={`${Math.round(dailyReport?.score?.sleepScore ?? 0)}%`} />
              <MetricTile label="Fitness Score" value={`${Math.round(dailyReport?.score?.fitnessScore ?? 0)}%`} />
              <MetricTile label="Productivity" value={`${Math.round(dailyReport?.score?.productivityScore ?? 0)}%`} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>Activities Logged ({dailyReport?.logs?.length ?? 0})</Text>
              {(dailyReport?.logs ?? []).slice(0, 5).map((log: Record<string, unknown>, idx: number) => (
                <Text key={idx as number} style={[styles.fbItem, { color: theme.colors.secondaryText }]}>
                  • {(log.activity as { name: string })?.name ?? 'Activity'}{log.durationMin ? ` — ${log.durationMin}min` : ''}
                </Text>
              ))}
              {(dailyReport?.logs?.length ?? 0) === 0 && (
                <Text style={[styles.fbItem, { color: theme.colors.secondaryText }]}>No activities logged yet today.</Text>
              )}
            </View>
          </>
        )}

        {/* ── WEEKLY ── */}
        {activeTab === 'weekly' && !weeklyLoading && weeklyReport && (
          <>
            <ReportChart
              title="7-Day Performance Score"
              subtitle={`${formatDateHeader(weeklyReport.startDateKey)} – ${formatDateHeader(weeklyReport.endDateKey)}`}
              data={(scoreHistory as Array<{ dateKey: string; totalScore: number }>).map((d) => ({
                label: formatShortWeekday(d.dateKey),
                value: Math.round(d.totalScore),
                maxValue: 100,
                highlight: d.dateKey === todayKey,
              }))}
            />
            <View style={styles.metricGrid}>
              <MetricTile label="Avg Daily Score" value={`${Math.round(weeklyReport.avgScore)} / 100`} />
              <MetricTile label="Avg Sleep" value={weeklyReport.avgSleepMin ? `${Math.round(weeklyReport.avgSleepMin / 60)}h ${weeklyReport.avgSleepMin % 60}m` : '--'} />
              {Object.entries(weeklyReport.categoryBreakdown ?? {}).slice(0, 2).map(([cat, min]) => (
                <MetricTile key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={`${min as number}min`} />
              ))}
            </View>
          </>
        )}

        {/* ── MONTHLY ── */}
        {activeTab === 'monthly' && !monthlyLoading && monthlyReport && (
          <>
            <View style={styles.metricGrid}>
              <MetricTile label="Active Days" value={`${monthlyReport.activeDays}`} />
              <MetricTile label="Avg Score" value={`${Math.round(monthlyReport.avgScore)} / 100`} />
              <MetricTile label="Avg Sleep" value={monthlyReport.avgSleepMin ? `${Math.round(monthlyReport.avgSleepMin / 60)}h` : '--'} />
            </View>
            <ReportChart
              title={`Monthly Trend — ${year}/${String(month).padStart(2, '0')}`}
              subtitle="Daily scores for this month"
              data={(monthlyReport.scores as Array<{ dateKey: string; totalScore: number }>).map((d) => ({
                label: d.dateKey.slice(8),
                value: Math.round(d.totalScore),
                maxValue: 100,
              }))}
            />
          </>
        )}

        <SecondaryButton title="Open Personal Guidance" onPress={() => router.push('/reports/guidance')} icon={<Sparkles size={16} color={theme.colors.secondaryTeal} />} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.metricTile, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
      <Text style={[styles.metricValue, { color: theme.colors.primaryText }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.colors.secondaryText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxl },
  guidanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  guidanceText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12 },
  segmentBar: { flexDirection: 'row', borderRadius: RADIUS.md, borderWidth: 1, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  navArrow: { padding: 4 },
  dateTitle: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 14 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTile: { width: '48.5%', borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: 2 },
  metricValue: { fontFamily: FONT_FAMILIES.bold, fontSize: 16 },
  metricLabel: { fontFamily: FONT_FAMILIES.regular, fontSize: 12 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.base, gap: SPACING.sm },
  cardTitle: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 15 },
  fbItem: { fontFamily: FONT_FAMILIES.regular, fontSize: 13, lineHeight: 20 },
});
