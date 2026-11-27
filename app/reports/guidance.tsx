import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info } from 'lucide-react-native';
import { AppHeader, InsightCard, LoadingState } from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useGuidance } from '../../src/hooks/useReports';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

export default function PersonalGuidanceScreen() {
  const theme = useAppTheme();
  const { data: guidance, isLoading } = useGuidance();

  if (isLoading) {
    return <LoadingState />;
  }

  const tips: string[] = guidance?.tips ?? [];
  const avgScore = Math.round(guidance?.basedOn?.avgScore ?? 0);
  const avgSleepHours =
    Math.round(((guidance?.basedOn?.avgSleepMin ?? 0) / 60) * 10) / 10;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Personal Guidance"
          subtitle="Rule-based suggestions from your routine"
          showBack
        />

        <View
          style={[
            styles.disclaimer,
            {
              backgroundColor: theme.colors.tealTint,
              borderColor: theme.colors.secondaryTeal,
            },
          ]}
        >
          <Info size={18} color={theme.colors.secondaryTeal} />
          <Text style={[styles.disclaimerText, { color: theme.colors.primaryText }]}>
            This guidance is generated using predefined lifestyle rules—not an AI coach or medical diagnostic tool. Use it as gentle support for building steady habits.
          </Text>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
            theme.shadow,
          ]}
        >
          <InsightCard
            title="Weekly Routine Summary"
            badge={`Avg Score: ${avgScore}`}
            body={`Based on your 7-day average score (${avgScore}/100) and average sleep (${avgSleepHours}h).`}
          />
          <View style={styles.tipsList}>
            {tips.length === 0 ? (
              <Text style={[styles.tipItem, { color: theme.colors.secondaryText }]}>
                Log more activities this week to receive personalized routine tips.
              </Text>
            ) : (
              tips.map((tip, idx) => (
                <Text
                  key={`tip-${idx}`}
                  style={[styles.tipItem, { color: theme.colors.primaryText }]}
                >
                  • {tip}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  tipsList: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: 6,
  },
  tipItem: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 19,
  },
});
