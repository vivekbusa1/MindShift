import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function CustomInput({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  style,
  ...rest
}: CustomInputProps) {
  const theme = useAppTheme();
  const [hidden, setHidden] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
    ? theme.colors.secondaryTeal
    : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.primaryText }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: theme.colors.white,
            borderColor,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          secureTextEntry={isPassword ? hidden : rest.secureTextEntry}
          placeholderTextColor={theme.colors.secondaryText}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: theme.colors.primaryText },
            style,
          ]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((prev) => !prev)}
            style={styles.eyeBtn}
          >
            {hidden ? (
              <Eye size={18} color={theme.colors.secondaryText} />
            ) : (
              <EyeOff size={18} color={theme.colors.secondaryText} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: theme.colors.secondaryText }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
  inputBox: {
    minHeight: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  hintText: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
});
