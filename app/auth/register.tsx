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
  AppHeader,
  CustomInput,
  PrimaryButton,
} from '../../src/components';
import { validateEmail, validatePassword } from '../../src/features/auth/authService';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useRegister } from '../../src/hooks/useAuth';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const theme = useAppTheme();
  const register = useRegister();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    register.mutate(
      { email: data.email, password: data.password },
      {
        onError: (err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : 'Registration failed. That email may already be taken.';
          setErrorMsg(msg);
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
          <AppHeader
            title="Create Account"
            subtitle="Start tracking your daily lifestyle"
            showBack
          />

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
                  placeholder="At least 6 characters"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={theme.colors.secondaryText} />}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                validate: (v) =>
                  v === getValues('password') || 'Passwords do not match.',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock size={18} color={theme.colors.secondaryText} />}
                />
              )}
            />

            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.colors.errorTint },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Continue to Profile Setup"
              onPress={handleSubmit(onSubmit)}
              loading={register.isPending}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.bottomText, { color: theme.colors.secondaryText }]}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.linkText, { color: theme.colors.secondaryTeal }]}>
                Sign in
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
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  errorBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  bottomText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
  },
  linkText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
});
