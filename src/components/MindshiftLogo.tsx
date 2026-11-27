import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MINDSHIFT_COLORS } from '../theme';

interface MindshiftLogoProps {
  size?: number;
}

/**
 * Approved flat Mindshift emblem (no gradients).
 * Uses Primary Navy (#071F3D), Secondary Teal (#00A58A), and Crisp White (#FFFFFF).
 */
export function MindshiftLogo({ size = 64 }: MindshiftLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="18" fill={MINDSHIFT_COLORS.primaryNavy} />
        <Circle cx="32" cy="32" r="21" stroke={MINDSHIFT_COLORS.secondaryTeal} strokeWidth="3.5" />
        <Path
          d="M19 37L26 25L32 34L39 22L45 37"
          stroke={MINDSHIFT_COLORS.white}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="39" cy="22" r="3" fill={MINDSHIFT_COLORS.secondaryTeal} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
