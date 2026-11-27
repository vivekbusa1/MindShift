import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppHeader, CustomInput, PrimaryButton } from '../../src/components';
import { validateEmail } from '../../src/features/auth/authService';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { authApi } from '../../src/services/api';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

interface ForgotFormValues {
  email: string;
}

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const [statusMsg, setStatusMsg] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const forgotMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setStatusMsg(null);
    forgotMutation.mutate(data.email, {
      onSuccess: (res: { message?: string }) => {
        setStatusMsg({
          type: 'success',
          text: res?.message ?? 'If this email exists, a reset link will be sent.',
        });
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Request failed. Please try again.';
        setStatusMsg({ type: 'error', text: msg });
      },
    });
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
            title="Forgot Password"
            subtitle="Enter your email to receive a reset link"
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
                  label="Email Address"
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

            {statusMsg ? (
              <View
                style={[
                  styles.statusBox,
                  {
                    backgroundColor:
                      statusMsg.type === 'error'
                        ? theme.colors.errorTint
                        : theme.colors.successTint,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        statusMsg.type === 'error'
                          ? theme.colors.error
                          : theme.colors.success,
                    },
                  ]}
                >
                  {statusMsg.text}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={forgotMutation.isPending}
            />

            {statusMsg?.type === 'success' ? (
              <PrimaryButton
                title="Back to Sign In"
                onPress={() => router.replace('/auth/login')}
              />
            ) : null}
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
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statusBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    lineHeight: 18,
  },
});
