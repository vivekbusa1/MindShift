import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { AVATAR_OPTIONS } from '../constants';
import { FONT_FAMILIES } from '../theme';

interface AvatarBadgeProps {
  avatarId: string;
  name?: string;
  size?: number;
}

export function AvatarBadge({ avatarId, name, size = 44 }: AvatarBadgeProps) {
  const preset = AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];
  const initials = name?.trim()
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : preset.initials;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: preset.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: preset.fg,
            fontSize: Math.round(size * 0.36),
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONT_FAMILIES.bold,
  },
});
