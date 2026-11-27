/**
 * Mindshift Design System Tokens
 *
 * Strictly flat color palette (no gradients) following approved Mindshift branding:
 * - Primary Navy: #071F3D
 * - Secondary Teal: #00A58A
 * - Light Background: #E8F8F3
 * - Surface White: #FFFFFF
 */

export const MINDSHIFT_COLORS = {
  primaryNavy: '#071F3D',
  secondaryTeal: '#00A58A',
  lightBackground: '#E8F8F3',
  white: '#FFFFFF',
  primaryText: '#071F3D',
  secondaryText: '#64748B',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  border: '#E2E8F0',
  // Derived flat tints (no gradients)
  tealTint: '#D9F5EE',
  navyTint: '#E9EEF5',
  successTint: '#DCFCE7',
  warningTint: '#FEF3C7',
  errorTint: '#FEE2E2',
  mutedSurface: '#F8FAFC',
} as const;

export const DARK_PALETTE_COLORS = {
  primaryNavy: '#00A58A',
  secondaryTeal: '#00C4A4',
  lightBackground: '#071324',
  white: '#0F223D',
  primaryText: '#F8FAFC',
  secondaryText: '#94A3B8',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',
  border: '#1E3A5F',
  tealTint: '#0D3B3E',
  navyTint: '#162D4D',
  successTint: '#133824',
  warningTint: '#3D2E0E',
  errorTint: '#3B181E',
  mutedSurface: '#132847',
} as const;

export type ThemeColors = {
  primaryNavy: string;
  secondaryTeal: string;
  lightBackground: string;
  white: string;
  primaryText: string;
  secondaryText: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  tealTint: string;
  navyTint: string;
  successTint: string;
  warningTint: string;
  errorTint: string;
  mutedSurface: string;
};

export const FONT_FAMILIES = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const TYPOGRAPHY = {
  hero: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h1: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  captionMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
} as const;

export const CARD_ELEVATION = {
  shadowColor: '#071F3D',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
} as const;
