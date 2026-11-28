import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, LoadingState, ThemePickerCard } from '../../src/components';
import { TIMEZONE_OPTIONS } from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import {
  usePreferences,
  useProfile,
  useUpdatePreferences,
  useUpdateProfile,
} from '../../src/hooks/useProfile';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

export default function PreferencesScreen() {
  const theme = useAppTheme();
  const { data: preferences, isLoading: prefLoading } = usePreferences();
  const { data: profile } = useProfile();
  const updatePreferences = useUpdatePreferences();
  const updateProfile = useUpdateProfile();

  if (prefLoading) {
    return <LoadingState />;
  }

  const currentTimezone = profile?.timezone ?? 'Asia/Kolkata';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="App Preferences"
          subtitle="Notifications, timezone, privacy & theme"
          showBack
        />

        {/* Theme */}
        <ThemePickerCard />

        {/* Notifications */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
            Notification Preferences
          </Text>
          <ToggleRow
            label="Morning Check-In Cue"
            sub="Gentle reminder near your preferred wake time"
            value={preferences?.morningCheckIn ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ morningCheckIn: val })
            }
          />
          <ToggleRow
            label="Bedtime Wind-Down Cue"
            sub="Reminder before your bedtime target"
            value={preferences?.bedtimeReminder ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ bedtimeReminder: val })
            }
          />
          <ToggleRow
            label="Streak Risk Alert"
            sub="Warn when daily goals are still pending"
            value={preferences?.streakRiskAlert ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ streakRiskAlert: val })
            }
          />
          <ToggleRow
            label="Weekly Summary Ready"
            sub="Highlight weekly performance insights"
            value={preferences?.weeklySummaryReady ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ weeklySummaryReady: val })
            }
          />
        </View>

        {/* Timezone */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
            Timezone Settings
          </Text>
          <Text style={[styles.subText, { color: theme.colors.secondaryText }]}>
            All daily scores, streaks, and shield evaluations follow this timezone.
          </Text>
          <View style={styles.tzWrap}>
            {TIMEZONE_OPTIONS.map((tz) => {
              const selected = currentTimezone === tz;
              return (
                <Pressable
                  key={tz}
                  onPress={() => updateProfile.mutate({ timezone: tz })}
                  style={[
                    styles.tzChip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryNavy
                        : theme.colors.mutedSurface,
                      borderColor: selected
                        ? theme.colors.primaryNavy
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tzText,
                      { color: selected ? '#FFFFFF' : theme.colors.primaryText },
                    ]}
                  >
                    {tz}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Privacy */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
            Privacy Settings
          </Text>
          <ToggleRow
            label="Show Me on Leaderboard"
            sub="Share your score on the community leaderboard"
            value={preferences?.showOnLeaderboard ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ showOnLeaderboard: val })
            }
          />
          <ToggleRow
            label="Label Late Entries as Self-Reported"
            sub="Keep transparent audit trail for corrected logs"
            value={preferences?.markLateEntriesClearly ?? true}
            onChange={(val) =>
              updatePreferences.mutate({ markLateEntriesClearly: val })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.toggleRow, { borderTopColor: theme.colors.border }]}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: theme.colors.primaryText }]}>
          {label}
        </Text>
        <Text style={[styles.toggleSub, { color: theme.colors.secondaryText }]}>
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.secondaryTeal,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
  },
  subText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
  },
  toggleSub: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
  tzWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tzChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  tzText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
});
