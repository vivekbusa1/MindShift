import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppHeader,
  CustomInput,
  DateTimePickerField,
  PrimaryButton,
} from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import {
  useActivities,
  useActivityLogs,
  useLogActivity,
} from '../../src/hooks/useActivities';
import { usePreferences, useProfile } from '../../src/hooks/useProfile';
import { activitiesApi } from '../../src/services/api';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { formatTimeInTimezone, getTodayDateKey } from '../../src/utils/date';

interface BackendActivity {
  id: string;
  name: string;
  unit?: string | null;
}

interface BackendLog {
  id: string;
  activityId: string;
  dateKey: string;
  startTime?: string | null;
  endTime?: string | null;
  quantity?: number | null;
  note?: string | null;
  createdAt: string;
  activity?: { name: string };
}

export default function LateEntryScreen() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const { editLogId } = useLocalSearchParams<{ editLogId?: string }>();

  const { data: activities = [] } = useActivities();
  const { data: logs = [] } = useActivityLogs();
  const { data: profile } = useProfile();
  const { data: preferences } = usePreferences();
  const logActivity = useLogActivity();

  const updateLog = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      activitiesApi.updateLog(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activityLogs'] });
      qc.invalidateQueries({ queryKey: ['dailyScore'] });
    },
  });

  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  const lateWindowHours = preferences?.lateEntryWindowHours ?? 24;

  const logToEdit = useMemo(
    () => (logs as BackendLog[]).find((l) => l.id === editLogId),
    [logs, editLogId]
  );

  const activeActivities = activities as BackendActivity[];

  const [selectedActivityId, setSelectedActivityId] = useState(
    logToEdit?.activityId ?? activeActivities[0]?.id ?? ''
  );

  const selectedActivity =
    activeActivities.find((a) => a.id === selectedActivityId) ??
    activeActivities[0];

  const [actualDate, setActualDate] = useState<Date>(() =>
    logToEdit?.startTime
      ? new Date(logToEdit.startTime)
      : logToEdit?.createdAt
      ? new Date(logToEdit.createdAt)
      : new Date(Date.now() - 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(() =>
    logToEdit?.endTime
      ? new Date(logToEdit.endTime)
      : new Date(Date.now() - 15 * 60 * 1000)
  );
  const [quantity, setQuantity] = useState(
    String(logToEdit?.quantity ?? 1)
  );
  const [note, setNote] = useState(logToEdit?.note ?? '');
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const now = new Date();
  const minAllowed = new Date(
    now.getTime() - lateWindowHours * 60 * 60 * 1000
  );

  const handleSave = () => {
    setFeedback(null);

    if (actualDate.getTime() > Date.now()) {
      setFeedback({ ok: false, message: 'Future timestamps are not allowed.' });
      return;
    }

    const durationMin = Math.max(
      1,
      Math.round((endDate.getTime() - actualDate.getTime()) / 60000)
    );
    const dateKey = actualDate.toISOString().slice(0, 10) || getTodayDateKey(timezone);

    if (logToEdit) {
      updateLog.mutate(
        {
          id: logToEdit.id,
          data: {
            startTime: actualDate.toISOString(),
            endTime: endDate.getTime() > actualDate.getTime() ? endDate.toISOString() : undefined,
            durationMin: endDate.getTime() > actualDate.getTime() ? durationMin : undefined,
            note: note.trim() || undefined,
            isLateEntry: true,
          },
        },
        {
          onSuccess: () => {
            setFeedback({ ok: true, message: 'Activity time corrected.' });
            setTimeout(() => router.back(), 600);
          },
          onError: (err: unknown) => {
            setFeedback({
              ok: false,
              message: err instanceof Error ? err.message : 'Failed to update log.',
            });
          },
        }
      );
      return;
    }

    if (!selectedActivity) {
      setFeedback({ ok: false, message: 'Please select an activity.' });
      return;
    }

    const qtyNum = Number(quantity);

    logActivity.mutate(
      {
        activityId: selectedActivity.id,
        dateKey,
        startTime: actualDate.toISOString(),
        endTime: endDate.getTime() > actualDate.getTime() ? endDate.toISOString() : undefined,
        durationMin: endDate.getTime() > actualDate.getTime() ? durationMin : undefined,
        quantity: !Number.isNaN(qtyNum) && qtyNum > 0 ? qtyNum : undefined,
        unit: selectedActivity.unit ?? undefined,
        note: note.trim() || undefined,
        source: 'late_entry',
        isLateEntry: true,
      },
      {
        onSuccess: () => {
          setFeedback({ ok: true, message: 'Late activity entry saved.' });
          setTimeout(() => router.back(), 600);
        },
        onError: (err: unknown) => {
          setFeedback({
            ok: false,
            message: err instanceof Error ? err.message : 'Failed to save late entry.',
          });
        },
      }
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AppHeader
            title={logToEdit ? 'Correct Activity Time' : 'Late Activity Entry'}
            subtitle={`Allowed within ${lateWindowHours}-hour window`}
            showBack
          />

          <View
            style={[
              styles.banner,
              {
                backgroundColor: theme.colors.warningTint,
                borderColor: theme.colors.warning,
              },
            ]}
          >
            <AlertTriangle size={18} color={theme.colors.warning} />
            <Text style={[styles.bannerText, { color: theme.colors.primaryText }]}>
              Corrected or late entries are stored with both actual activity time and submission time, and marked as Self-reported. Future timestamps are blocked.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {!logToEdit ? (
              <>
                <Text style={[styles.label, { color: theme.colors.primaryText }]}>
                  Select Activity
                </Text>
                <View style={styles.chipWrap}>
                  {activeActivities.map((act) => {
                    const selected = act.id === (selectedActivity?.id ?? '');
                    return (
                      <Pressable
                        key={act.id}
                        onPress={() => setSelectedActivityId(act.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? theme.colors.secondaryTeal
                              : theme.colors.mutedSurface,
                            borderColor: selected
                              ? theme.colors.secondaryTeal
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: selected
                                ? '#FFFFFF'
                                : theme.colors.primaryText,
                            },
                          ]}
                        >
                          {act.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.editingHeader}>
                <Text style={[styles.editTitle, { color: theme.colors.primaryText }]}>
                  Editing: {logToEdit.activity?.name ?? 'Activity'}
                </Text>
                <Text style={[styles.editMeta, { color: theme.colors.secondaryText }]}>
                  Submitted at: {formatTimeInTimezone(logToEdit.createdAt, timezone)}
                </Text>
              </View>
            )}

            <DateTimePickerField
              label="Actual Start Time"
              mode="datetime"
              value={actualDate}
              minimumDate={minAllowed}
              maximumDate={now}
              onChange={setActualDate}
            />

            <DateTimePickerField
              label="Actual End Time (optional)"
              mode="datetime"
              value={endDate}
              minimumDate={minAllowed}
              maximumDate={now}
              onChange={setEndDate}
            />

            {!logToEdit && selectedActivity?.unit ? (
              <CustomInput
                label={`Quantity (${selectedActivity.unit}, optional)`}
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            ) : null}

            <CustomInput
              label="Note"
              placeholder="Context for this entry..."
              value={note}
              onChangeText={setNote}
            />
          </View>

          {feedback ? (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: feedback.ok
                    ? theme.colors.successTint
                    : theme.colors.errorTint,
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color: feedback.ok
                      ? theme.colors.success
                      : theme.colors.error,
                  },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            title={logToEdit ? 'Save Correction' : 'Save Late Entry'}
            onPress={handleSave}
            loading={logActivity.isPending || updateLog.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  bannerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  label: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  editingHeader: {
    gap: 2,
  },
  editTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
  },
  editMeta: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  feedbackBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },
  feedbackText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
});
