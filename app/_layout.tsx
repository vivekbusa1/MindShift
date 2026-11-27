import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMindshiftStore } from '../src/store/useMindshiftStore';
import { useAppTheme } from '../src/hooks/useAppTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hydrate = useMindshiftStore((s) => s.hydrate);
  const isHydrated = useMindshiftStore((s) => s.isHydrated);
  const theme = useAppTheme();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isHydrated]);

  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
    <SafeAreaProvider>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.lightBackground },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="setup/profile-setup" />
        <Stack.Screen name="setup/goal-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activities/create" />
        <Stack.Screen name="activities/history" />
        <Stack.Screen name="activities/late-entry" />
        <Stack.Screen name="sleep/index" />
        <Stack.Screen name="reports/guidance" />
        <Stack.Screen name="streaks/index" />
        <Stack.Screen name="streaks/shields" />
        <Stack.Screen name="settings/preferences" />
      </Stack>
    </SafeAreaProvider>
    </QueryClientProvider>
  );
}
