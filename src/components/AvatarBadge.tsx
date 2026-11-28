import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AVATAR_OPTIONS } from '../constants';
import { FONT_FAMILIES } from '../theme';

interface AvatarBadgeProps {
  avatarId: string;
  imageUri?: string | null;
  name?: string;
  size?: number;
}

export function AvatarBadge({
  avatarId,
  imageUri,
  name,
  size = 44,
}: AvatarBadgeProps) {
  const preset = AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];
  const initials = name?.trim()
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : preset.initials;

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

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
  image: {
    resizeMode: 'cover',
  },
  text: {
    fontFamily: FONT_FAMILIES.bold,
  },
});
