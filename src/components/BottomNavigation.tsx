import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router';
import {
  BarChart3,
  CheckSquare,
  Home,
  Trophy,
  User,
} from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

const TAB_CONFIG: Record<string, { label: string; icon: typeof Home }> = {
  index: { label: 'Home', icon: Home },
  activities: { label: 'Activities', icon: CheckSquare },
  reports: { label: 'Reports', icon: BarChart3 },
  leaderboard: { label: 'Ranks', icon: Trophy },
  profile: { label: 'Profile', icon: User },
};

export function BottomNavigation({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: TabBarProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const cfg = TAB_CONFIG[route.name] ?? {
          label: options.title ?? route.name,
          icon: Home,
        };
        const Icon = cfg.icon;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={cfg.label}
            onPress={onPress}
            style={styles.tabBtn}
          >
            <View
              style={[
                styles.iconPill,
                isFocused && { backgroundColor: theme.colors.tealTint },
              ]}
            >
              <Icon
                size={20}
                color={
                  isFocused
                    ? theme.colors.secondaryTeal
                    : theme.colors.secondaryText
                }
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isFocused
                    ? theme.colors.primaryText
                    : theme.colors.secondaryText,
                  fontFamily: isFocused
                    ? FONT_FAMILIES.semiBold
                    : FONT_FAMILIES.regular,
                },
              ]}
            >
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: SPACING.xs,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  label: {
    fontSize: 11,
  },
});
