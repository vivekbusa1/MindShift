import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Inbox } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { PrimaryButton } from './Buttons';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.tealTint },
        ]}
      >
        {icon ?? <Inbox size={24} color={theme.colors.secondaryTeal} />}
      </View>
      <Text style={[styles.title, { color: theme.colors.primaryText }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
}

export function LoadingState({ message = 'Loading your Mindshift data...' }: { message?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.colors.secondaryTeal} />
      <Text style={[styles.loadingText, { color: theme.colors.secondaryText }]}>
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  title = 'Something needs attention',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.errorTint,
          borderColor: theme.colors.error,
        },
      ]}
    >
      <AlertCircle size={24} color={theme.colors.error} />
      <Text style={[styles.title, { color: theme.colors.primaryText }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
        {message}
      </Text>
      {onRetry ? (
        <PrimaryButton
          title="Try Again"
          onPress={onRetry}
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: SPACING.sm,
    minWidth: 160,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
  },
});
