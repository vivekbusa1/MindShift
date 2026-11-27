import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, Edit3, Trash2 } from 'lucide-react-native';
import { getCategoryMeta } from '../constants';
import { useAppTheme } from '../hooks/useAppTheme';
import { ActivityLogEntry } from '../types';
import { formatDurationMinutes, formatTimeInTimezone } from '../utils/date';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { EmptyState } from './StateViews';

interface ActivityTimelineProps {
  logs: ActivityLogEntry[];
  timezone: string;
  onCorrectLog?: (log: ActivityLogEntry) => void;
  onDeleteLog?: (log: ActivityLogEntry) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ActivityTimeline({
  logs,
  timezone,
  onCorrectLog,
  onDeleteLog,
  emptyTitle = 'No activities recorded yet',
  emptyDescription = 'Send a short message like "Wake Up", "Workout Start", or "Water 250ml" to begin your timeline.',
}: ActivityTimelineProps) {
  const theme = useAppTheme();

  if (logs.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const ordered = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View style={styles.list}>
      {ordered.map((log, index) => {
        const meta = getCategoryMeta(log.category);
        const timeStr = formatTimeInTimezone(log.timestamp, timezone);

        const badgeLabel =
          log.eventKind === 'start'
            ? 'Started'
            : log.eventKind === 'end'
            ? `Completed • ${formatDurationMinutes(log.durationMinutes)}`
            : log.eventKind === 'quantity'
            ? `${log.quantity ?? 1} ${log.unit ?? ''}`
            : 'Single Event';

        return (
          <View key={log.id} style={styles.row}>
            <View style={styles.railCol}>
              <View
                style={[styles.dot, { backgroundColor: meta?.accent ?? theme.colors.secondaryTeal }]}
              />
              {index < ordered.length - 1 ? (
                <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
              ) : null}
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
              <View style={styles.topRow}>
                <View style={styles.nameCol}>
                  <Text style={[styles.name, { color: theme.colors.primaryText }]}>
                    {log.activityName}
                    {log.eventKind === 'start'
                      ? ' Start'
                      : log.eventKind === 'end'
                      ? ' End'
                      : ''}
                  </Text>
                  <View style={styles.metaRow}>
                    <Clock size={12} color={theme.colors.secondaryText} />
                    <Text style={[styles.timeText, { color: theme.colors.secondaryText }]}>
                      {timeStr} • {meta?.shortLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  {onCorrectLog ? (
                    <Pressable
                      accessibilityLabel={`Correct ${log.activityName}`}
                      onPress={() => onCorrectLog(log)}
                      style={styles.iconAction}
                    >
                      <Edit3 size={15} color={theme.colors.secondaryText} />
                    </Pressable>
                  ) : null}
                  {onDeleteLog ? (
                    <Pressable
                      accessibilityLabel={`Delete ${log.activityName}`}
                      onPress={() => onDeleteLog(log)}
                      style={styles.iconAction}
                    >
                      <Trash2 size={15} color={theme.colors.error} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.tealTint },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: theme.colors.primaryText }]}
                  >
                    {badgeLabel}
                  </Text>
                </View>

                {log.isLateEntry ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.colors.warningTint },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: theme.colors.primaryText }]}
                    >
                      Late Entry • Self-reported
                    </Text>
                  </View>
                ) : null}
              </View>

              {log.note ? (
                <Text style={[styles.note, { color: theme.colors.secondaryText }]}>
                  {log.note}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  railCol: {
    width: 18,
    alignItems: 'center',
    paddingTop: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconAction: {
    padding: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
  },
  note: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
});
