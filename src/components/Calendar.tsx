import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { DayStreakStatus } from '../types';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

export interface CalendarDayCell {
  dateKey: string;
  label: string; // e.g., "Mon" or "24"
  sublabel?: string;
  status: DayStreakStatus;
  score?: number;
}

interface CalendarProps {
  title?: string;
  days: CalendarDayCell[];
  selectedDateKey?: string;
  onSelectDate?: (dateKey: string) => void;
  columns?: 7;
}

export function Calendar({
  title,
  days,
  selectedDateKey,
  onSelectDate,
}: CalendarProps) {
  const theme = useAppTheme();

  const getColors = (status: DayStreakStatus) => {
    switch (status) {
      case 'completed':
        return { bg: theme.colors.secondaryTeal, fg: '#FFFFFF', border: theme.colors.secondaryTeal };
      case 'protected':
        return { bg: theme.colors.navyTint, fg: theme.colors.primaryNavy, border: theme.colors.primaryNavy };
      case 'missed':
        return { bg: theme.colors.errorTint, fg: theme.colors.error, border: theme.colors.error };
      case 'pending':
        return { bg: theme.colors.tealTint, fg: theme.colors.primaryText, border: theme.colors.secondaryTeal };
      default:
        return { bg: theme.colors.mutedSurface, fg: theme.colors.secondaryText, border: theme.colors.border };
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: theme.colors.primaryText }]}>
          {title}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {days.map((day) => {
          const palette = getColors(day.status);
          const isSelected = selectedDateKey === day.dateKey;
          return (
            <Pressable
              key={day.dateKey}
              onPress={() => onSelectDate?.(day.dateKey)}
              disabled={!onSelectDate}
              style={[
                styles.cell,
                {
                  backgroundColor: palette.bg,
                  borderColor: isSelected ? theme.colors.primaryText : palette.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <Text style={[styles.cellLabel, { color: palette.fg }]}>
                {day.label}
              </Text>
              {day.status === 'protected' ? (
                <Shield size={11} color={palette.fg} />
              ) : day.sublabel ? (
                <Text style={[styles.cellSub, { color: palette.fg }]}>
                  {day.sublabel}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={theme.colors.secondaryTeal} label="Completed" />
        <LegendDot color={theme.colors.primaryNavy} label="Protected" />
        <LegendDot color={theme.colors.error} label="Missed" />
        <LegendDot color={theme.colors.border} label="Empty" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.colors.secondaryText }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '12.5%',
    minWidth: 38,
    minHeight: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  cellLabel: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
  },
  cellSub: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
});
