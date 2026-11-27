import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { PrimaryButton, SecondaryButton } from './Buttons';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.secondaryText }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <SecondaryButton
              title={cancelLabel}
              onPress={onCancel}
              style={styles.btn}
            />
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              style={{
                ...styles.btn,
                backgroundColor: destructive
                  ? theme.colors.error
                  : theme.colors.secondaryTeal,
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 31, 61, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 18,
  },
  message: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  btn: {
    flex: 1,
  },
});
