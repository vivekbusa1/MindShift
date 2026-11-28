import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { Lock, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  CustomInput,
  MindshiftLogo,
  PrimaryButton,
  SecondaryButton,
} from '../../src/components';
import { APP_TAGLINE } from '../../src/constants';
import { validateEmail, validatePassword } from '../../src/features/auth/authService';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useLogin } from '../../src/hooks/useAuth';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const theme = useAppTheme();
  const login = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    login.mutate(
      { email: data.email, password: data.password },
      {
        onError: (err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : 'Login failed. Please check your credentials.';
          setAuthError(msg);
        },
      }
    );
  };

  const handleDemoLogin = () => {
    setValue('email', 'demo@mindshift.app');
    setValue('password', 'demo1234');
    login.mutate(
      { email: 'demo@mindshift.app', password: 'demo1234' },
      {
        onError: () => {
          setAuthError('Demo login failed. Make sure the backend server is running.');
        },
      }
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandHeader}>
            <MindshiftLogo size={96} />
            <Text style={[styles.title, { color: theme.colors.primaryText }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
              {APP_TAGLINE}
            </Text>
          </View>

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
            <Controller
              control={control}
              name="email"
              rules={{ validate: (v) => validateEmail(v) ?? true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color={theme.colors.secondaryText} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{ validate: (v) => validatePassword(v) ?? true }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Password"
                  placeholder="Your password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={theme.colors.secondaryText} />}
                />
              )}
            />

            <Pressable
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={[styles.linkText, { color: theme.colors.secondaryTeal }]}>
                Forgot password?
              </Text>
            </Pressable>

            {authError ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.colors.errorTint },
                ]}
              >
                <Text style={[styles.errorMsg, { color: theme.colors.error }]}>
                  {authError}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={login.isPending}
            />

            <SecondaryButton
              title="Try Demo Account"
              onPress={handleDemoLogin}
              loading={login.isPending}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.bottomText, { color: theme.colors.secondaryText }]}>
              New to Mindshift?
            </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={[styles.linkText, { color: theme.colors.secondaryTeal }]}>
                Create account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: SPACING.lg,
    gap: SPACING.base,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 24,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  errorBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  errorMsg: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
  },
  bottomText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
  },
});
