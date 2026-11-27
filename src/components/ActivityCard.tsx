import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Archive, ChevronRight, Edit3 } from 'lucide-react-native';
import { getCategoryMeta } from '../constants';
import { useAppTheme } from '../hooks/useAppTheme';
import { CustomActivityDefinition } from '../types';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface ActivityCardProps {
  activity: CustomActivityDefinition;
  onPress?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
}

export function ActivityCard({
  activity,
  onPress,
  onEdit,
  onToggleArchive,
}: ActivityCardProps) {
  const theme = useAppTheme();
  const meta = getCategoryMeta(activity.category);

  const typeLabel =
    activity.trackingType === 'duration'
      ? `Duration (${activity.targetValue} ${activity.unit} goal)`
      : activity.trackingType === 'quantity'
      ? `Quantity (${activity.targetValue} ${activity.unit} goal)`
      : 'Single Event';

  return (
    <Pressable
      onPress={onPress ?? onEdit}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
          opacity: activity.isArchived ? 0.65 : pressed ? 0.92 : 1,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.primaryText }]}>
              {activity.name}
            </Text>
            {activity.isArchived ? (
              <View style={[styles.tag, { backgroundColor: theme.colors.mutedSurface }]}>
                <Text style={[styles.tagText, { color: theme.colors.secondaryText }]}>
                  Archived
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
            {meta.label} • {typeLabel}
          </Text>
        </View>

        <View style={styles.actions}>
          {onEdit ? (
            <Pressable
              accessibilityLabel={`Edit ${activity.name}`}
              onPress={onEdit}
              style={styles.iconBtn}
            >
              <Edit3 size={16} color={theme.colors.primaryText} />
            </Pressable>
          ) : null}
          {onToggleArchive ? (
            <Pressable
              accessibilityLabel={`Archive ${activity.name}`}
              onPress={onToggleArchive}
              style={styles.iconBtn}
            >
              <Archive size={16} color={theme.colors.secondaryText} />
            </Pressable>
          ) : null}
          {onPress ? (
            <ChevronRight size={18} color={theme.colors.secondaryText} />
          ) : null}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={[styles.pill, { backgroundColor: theme.colors.tealTint }]}>
          <Text style={[styles.pillText, { color: theme.colors.primaryText }]}>
            {activity.repeatFrequency.replace('_', ' ')}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: theme.colors.navyTint }]}>
          <Text style={[styles.pillText, { color: theme.colors.primaryText }]}>
            Max {activity.scoringRule.maxPointsForRule} pts
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  tagText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
