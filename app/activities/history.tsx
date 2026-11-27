import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityTimeline,
  AppHeader,
  ConfirmationModal,
  CustomInput,
  LoadingState,
} from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import {
  useActivities,
  useActivityLogs,
  useDeleteLog,
} from '../../src/hooks/useActivities';
import { useProfile } from '../../src/hooks/useProfile';
import { FONT_FAMILIES, SPACING } from '../../src/theme';
import { ActivityCategory, ActivityLogEntry } from '../../src/types';
import { formatDateHeader } from '../../src/utils/date';

interface BackendLog {
  id: string;
  activityId: string;
  dateKey: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMin?: number | null;
  quantity?: number | null;
  unit?: string | null;
  note?: string | null;
  source?: string;
  isLateEntry?: boolean;
  rawMessage?: string | null;
  createdAt: string;
  activity?: { name: string; category: string };
}

export default function ActivityHistoryScreen() {
  const theme = useAppTheme();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const { data: rawLogs = [], isLoading } = useActivityLogs();
  const { data: activities = [] } = useActivities();
  const { data: profile } = useProfile();
  const deleteLog = useDeleteLog();

  const [query, setQuery] = useState('');
  const [logToDelete, setLogToDelete] = useState<ActivityLogEntry | null>(null);

  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  const targetActivity = (activities as Array<{ id: string; name: string }>).find(
    (a) => a.id === activityId
  );

  const groupedByDate = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped: ActivityLogEntry[] = (rawLogs as BackendLog[]).map((l) => ({
      id: l.id,
      activityId: l.activityId,
      activityName: l.activity?.name ?? 'Activity',
      category: (l.activity?.category ?? 'personal_development') as ActivityCategory,
      trackingType: l.durationMin ? 'duration' : l.quantity ? 'quantity' : 'single_event',
      eventKind: l.durationMin ? 'end' : l.quantity ? 'quantity' : 'single',
      rawMessage: l.rawMessage ?? l.activity?.name ?? '',
      timestamp: l.startTime ?? l.createdAt,
      submittedAt: l.createdAt,
      dateKey: l.dateKey,
      durationMinutes: l.durationMin ?? undefined,
      quantity: l.quantity ?? undefined,
      unit: l.unit ?? undefined,
      note: l.note ?? undefined,
      isLateEntry: Boolean(l.isLateEntry),
      isSelfReported: Boolean(l.isLateEntry),
      correctionHistory: [],
    }));

    const filtered = mapped.filter((l) => {
      if (activityId && l.activityId !== activityId) return false;
      if (!q) return true;
      return (
        l.activityName.toLowerCase().includes(q) ||
        l.rawMessage.toLowerCase().includes(q) ||
        l.dateKey.includes(q)
      );
    });

    const map = new Map<string, ActivityLogEntry[]>();
    for (const log of filtered) {
      const list = map.get(log.dateKey) ?? [];
      list.push(log);
      map.set(log.dateKey, list);
    }

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rawLogs, activityId, query]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title={
            targetActivity
              ? `${targetActivity.name} History`
              : 'Activity History'
          }
          subtitle="Tap edit on any recent log to correct its timestamp"
          showBack
        />

        <CustomInput
          placeholder="Search logs by name, message, or YYYY-MM-DD..."
          value={query}
          onChangeText={setQuery}
          leftIcon={<Search size={18} color={theme.colors.secondaryText} />}
        />

        {groupedByDate.length === 0 ? (
          <ActivityTimeline logs={[]} timezone={timezone} />
        ) : (
          groupedByDate.map(([dateKey, dayLogs]) => (
            <View key={dateKey} style={styles.dayGroup}>
              <Text style={[styles.dateTitle, { color: theme.colors.primaryText }]}>
                {formatDateHeader(dateKey)}
              </Text>
              <ActivityTimeline
                logs={dayLogs}
                timezone={timezone}
                onCorrectLog={(log) =>
                  router.push({
                    pathname: '/activities/late-entry',
                    params: { editLogId: log.id },
                  })
                }
                onDeleteLog={(log) => setLogToDelete(log)}
              />
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmationModal
        visible={Boolean(logToDelete)}
        title="Delete Log Entry?"
        message={`Delete "${logToDelete?.activityName}" from ${logToDelete?.dateKey}?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setLogToDelete(null)}
        onConfirm={() => {
          if (logToDelete) {
            deleteLog.mutate(logToDelete.id, {
              onSettled: () => setLogToDelete(null),
            });
          } else {
            setLogToDelete(null);
          }
        }}
      />
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
  dayGroup: {
    gap: SPACING.sm,
  },
  dateTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
  },
});
