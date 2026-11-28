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
import type { CustomThemeConfig, ThemePreference } from '../types';

export * from './tokens';

export type ThemeMode = ThemePreference;

export const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
  primaryNavy: '#071F3D',
  secondaryTeal: '#00A58A',
  lightBackground: '#E8F8F3',
  white: '#FFFFFF',
};

export const CUSTOM_THEME_PRESETS: {
  id: string;
  name: string;
  config: CustomThemeConfig;
}[] = [
  {
    id: 'ocean-mint',
    name: 'Ocean Mint',
    config: {
      primaryNavy: '#071F3D',
      secondaryTeal: '#00A58A',
      lightBackground: '#E8F8F3',
      white: '#FFFFFF',
    },
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    config: {
      primaryNavy: '#1E1B4B',
      secondaryTeal: '#4F46E5',
      lightBackground: '#EEF2FF',
      white: '#FFFFFF',
    },
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    config: {
      primaryNavy: '#431407',
      secondaryTeal: '#EA580C',
      lightBackground: '#FFF7ED',
      white: '#FFFFFF',
    },
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    config: {
      primaryNavy: '#14532D',
      secondaryTeal: '#16A34A',
      lightBackground: '#F0FDF4',
      white: '#FFFFFF',
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    config: {
      primaryNavy: '#F59E0B',
      secondaryTeal: '#FBBF24',
      lightBackground: '#0B1120',
      white: '#162032',
    },
  },
  {
    id: 'amoled-emerald',
    name: 'Slate Emerald',
    config: {
      primaryNavy: '#10B981',
      secondaryTeal: '#34D399',
      lightBackground: '#0F172A',
      white: '#1E293B',
    },
  },
];

export const THEME_COLOR_SWATCHES = {
  primaryNavy: ['#071F3D', '#1E1B4B', '#431407', '#14532D', '#3B0764', '#00A58A', '#F59E0B'],
  secondaryTeal: ['#00A58A', '#0284C7', '#4F46E5', '#EA580C', '#16A34A', '#DB2777', '#FBBF24'],
  lightBackground: ['#E8F8F3', '#EEF2FF', '#FFF7ED', '#F0FDF4', '#FDF2F8', '#071324', '#0F172A'],
  white: ['#FFFFFF', '#F8FAFC', '#FEFCE8', '#F0FDFA', '#0F223D', '#1E293B', '#18181B'],
};

function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function buildCustomThemeColors(custom: CustomThemeConfig): ThemeColors {
  const surfaceDark = isColorDark(custom.white);
  const bgDark = isColorDark(custom.lightBackground);
  const darkBase = surfaceDark || bgDark;

  return {
    primaryNavy: custom.primaryNavy,
    secondaryTeal: custom.secondaryTeal,
    lightBackground: custom.lightBackground,
    white: custom.white,
    primaryText: surfaceDark ? '#F8FAFC' : '#071F3D',
    secondaryText: surfaceDark ? '#94A3B8' : '#64748B',
    success: darkBase ? '#22C55E' : '#16A34A',
    warning: darkBase ? '#FBBF24' : '#F59E0B',
    error: darkBase ? '#EF4444' : '#DC2626',
    border: surfaceDark ? '#2A3B54' : '#E2E8F0',
    tealTint: surfaceDark ? '#14333A' : `${custom.secondaryTeal}18`,
    navyTint: surfaceDark ? '#192942' : `${custom.primaryNavy}14`,
    successTint: surfaceDark ? '#133824' : '#DCFCE7',
    warningTint: surfaceDark ? '#3D2E0E' : '#FEF3C7',
    errorTint: surfaceDark ? '#3B181E' : '#FEE2E2',
    mutedSurface: surfaceDark ? '#162438' : '#F8FAFC',
  };
}

export interface MindshiftTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  fonts: typeof FONT_FAMILIES;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  typography: typeof TYPOGRAPHY;
  shadow: typeof CARD_ELEVATION;
}

export const getTheme = (
  mode: ThemeMode = 'light',
  customTheme?: CustomThemeConfig
): MindshiftTheme => {
  const colors =
    mode === 'dark'
      ? DARK_PALETTE_COLORS
      : mode === 'custom'
      ? buildCustomThemeColors(customTheme ?? DEFAULT_CUSTOM_THEME)
      : MINDSHIFT_COLORS;

  return {
    mode,
    colors,
    fonts: FONT_FAMILIES,
    spacing: SPACING,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    shadow: CARD_ELEVATION,
  };
};
