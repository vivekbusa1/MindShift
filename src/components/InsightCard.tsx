import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface InsightCardProps {
  title: string;
  body: string;
  badge?: string;
  tone?: 'teal' | 'warning' | 'success';
  icon?: React.ReactNode;
}

export function InsightCard({
  title,
  body,
  badge,
  tone = 'teal',
  icon,
}: InsightCardProps) {
  const theme = useAppTheme();

  const accentBg =
    tone === 'warning'
      ? theme.colors.warningTint
      : tone === 'success'
      ? theme.colors.successTint
      : theme.colors.tealTint;

  const accentColor =
    tone === 'warning'
      ? theme.colors.warning
      : tone === 'success'
      ? theme.colors.success
      : theme.colors.secondaryTeal;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
          {icon ?? <Lightbulb size={18} color={accentColor} />}
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            {title}
          </Text>
          {badge ? (
            <Text style={[styles.badge, { color: accentColor }]}>{badge}</Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.body, { color: theme.colors.secondaryText }]}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  badge: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
  },
  body: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 20,
  },
});
