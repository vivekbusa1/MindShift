import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { MindshiftLogo } from '../src/components';
import { APP_NAME, APP_TAGLINE } from '../src/constants';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { authApi } from '../src/services/api';
import { deleteStoredToken, getStoredToken } from '../src/services/apiClient';
import { useMindshiftStore } from '../src/store/useMindshiftStore';
import { FONT_FAMILIES, SPACING } from '../src/theme';

export default function SplashRoute() {
  const theme = useAppTheme();
  const isHydrated = useMindshiftStore((s) => s.isHydrated);
  const hasSeenOnboarding = useMindshiftStore((s) => s.hasSeenOnboarding);

  const scale = useSharedValue(0.84);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 480 });
  }, [opacity, scale]);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const token = await getStoredToken('access_token');
        if (token) {
          const me = await authApi.getMe();
          if (cancelled) return;
          if (me?.profile && !me.profile.nickname) {
            router.replace('/setup/profile-setup');
          } else {
            router.replace('/(tabs)');
          }
          return;
        }
      } catch {
        await deleteStoredToken('access_token');
        await deleteStoredToken('refresh_token');
      }

      if (cancelled) return;
      if (hasSeenOnboarding) {
        router.replace('/auth/login');
      } else {
        router.replace('/onboarding');
      }
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isHydrated, hasSeenOnboarding]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.lightBackground },
      ]}
    >
      <Animated.View style={[styles.brandBox, logoStyle]}>
        <MindshiftLogo size={96} />
        <Text style={[styles.appName, { color: theme.colors.primaryText }]}>
          {APP_NAME}
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.secondaryTeal }]}>
          {APP_TAGLINE}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  brandBox: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  appName: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 32,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
