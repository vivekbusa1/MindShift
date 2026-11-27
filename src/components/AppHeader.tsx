import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightSlot?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightSlot,
}: AppHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress ?? (() => router.back())}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ChevronLeft size={20} color={theme.colors.primaryText} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <Text
            style={[styles.title, { color: theme.colors.primaryText }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: theme.colors.secondaryText }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
