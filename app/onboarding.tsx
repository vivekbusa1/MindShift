import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Flame, MessageSquareText } from 'lucide-react-native';
import { router } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '../src/components';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useMindshiftStore } from '../src/store/useMindshiftStore';
import { FONT_FAMILIES, RADIUS, SPACING } from '../src/theme';

const SLIDES = [
  {
    id: 'track',
    title: 'Track Your Daily Life',
    subtitle:
      'Log your entire day from waking up to sleeping with quick chat-style messages like "Wake Up", "Workout Start", or "Water 250ml". No slow forms required.',
    highlights: [
      'Instant timestamping for single events',
      'Automatic Start -> End duration timers',
      'Flexible quantity tracking & custom habits',
    ],
    icon: MessageSquareText,
  },
  {
    id: 'understand',
    title: 'Understand Your Performance',
    subtitle:
      'See how your daily choices align with your personal goals. Mindshift calculates your daily score out of 100 and turns logs into clear, nonjudgmental insights.',
    highlights: [
      'Weighted 100-point lifestyle gamification score',
      'Estimated sleep duration vs personal sleep target',
      'Dynamic Daily, Weekly & Monthly reports',
    ],
    icon: BarChart3,
  },
  {
    id: 'habits',
    title: 'Build Better Habits',
    subtitle:
      'Stay consistent with meaningful daily streaks, earn Recovery Shields every 7 eligible days, and compare normalized progress on the friendly demo leaderboard.',
    highlights: [
      'Streaks reward completed goals, not app opens',
      'Recovery Shields protect missed days safely',
      '100% local & private in Phase 1',
    ],
    icon: Flame,
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const markOnboardingSeen = useMindshiftStore((s) => s.markOnboardingSeen);
  const [stepIndex, setStepIndex] = useState(0);

  const slide = SLIDES[stepIndex];
  const Icon = slide.icon;
  const isLast = stepIndex === SLIDES.length - 1;

  const finishOnboarding = async () => {
    await markOnboardingSeen();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <View style={styles.topBar}>
        <Text style={[styles.stepTag, { color: theme.colors.secondaryTeal }]}>
          {stepIndex + 1} of {SLIDES.length}
        </Text>
        <Pressable onPress={finishOnboarding} hitSlop={10}>
          <Text style={[styles.skipText, { color: theme.colors.secondaryText }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.illustrationCard,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
            theme.shadow,
          ]}
        >
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.colors.tealTint },
            ]}
          >
            <Icon size={44} color={theme.colors.secondaryTeal} />
          </View>
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            {slide.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
            {slide.subtitle}
          </Text>

          <View style={styles.highlightList}>
            {slide.highlights.map((item) => (
              <View
                key={item}
                style={[
                  styles.highlightPill,
                  { backgroundColor: theme.colors.mutedSurface },
                ]}
              >
                <View
                  style={[
                    styles.bullet,
                    { backgroundColor: theme.colors.secondaryTeal },
                  ]}
                />
                <Text
                  style={[
                    styles.highlightText,
                    { color: theme.colors.primaryText },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  width: idx === stepIndex ? 24 : 8,
                  backgroundColor:
                    idx === stepIndex
                      ? theme.colors.secondaryTeal
                      : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.btnRow}>
          {stepIndex > 0 ? (
            <SecondaryButton
              title="Back"
              onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
              style={styles.halfBtn}
            />
          ) : null}
          <PrimaryButton
            title={isLast ? 'Get Started' : 'Next'}
            onPress={() => {
              if (isLast) {
                finishOnboarding();
              } else {
                setStepIndex((i) => i + 1);
              }
            }}
            style={styles.halfBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTag: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  skipText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  illustrationCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.base,
  },
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  highlightList: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
  footer: {
    gap: SPACING.base,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfBtn: {
    flex: 1,
  },
});
