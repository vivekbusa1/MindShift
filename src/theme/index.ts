import {
  CARD_ELEVATION,
  DARK_PALETTE_COLORS,
  FONT_FAMILIES,
  MINDSHIFT_COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type ThemeColors,
} from './tokens';

export * from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface MindshiftTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  fonts: typeof FONT_FAMILIES;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  typography: typeof TYPOGRAPHY;
  shadow: typeof CARD_ELEVATION;
}

export const getTheme = (mode: ThemeMode = 'light'): MindshiftTheme => ({
  mode,
  colors: mode === 'dark' ? DARK_PALETTE_COLORS : MINDSHIFT_COLORS,
  fonts: FONT_FAMILIES,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  shadow: CARD_ELEVATION,
});
