import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface MindshiftLogoProps {
  size?: number;
}

const LOGO_SOURCE = require('../../assets/icon.png');

/**
 * Mindshift brand logo rendered from assets/icon.png.
 */
export function MindshiftLogo({ size = 64 }: MindshiftLogoProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.24,
        },
      ]}
    >
      <Image
        source={LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
