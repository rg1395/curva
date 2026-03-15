export const colors = {
  // Backgrounds
  bg: '#08080A',
  surface: '#101013',
  card: '#16161A',
  border: '#252528',

  // Text
  text: '#FFFFFF',
  muted: '#87878C',

  // Brand
  accent: '#FF6B35',

  // Semantic
  green: '#34D399',   // Curvy / excellent asphalt
  blue: '#60A5FA',    // Panoramic
  yellow: '#FBBF24',  // Fair asphalt
  red: '#EF4444',     // Bad asphalt / recording

  // Gradient stops
  accentDark: '#CC5629',
  accentLight: '#FF8C5A',
} as const;

export const fonts = {
  display: 'ClashDisplay-Semibold',
  displayMedium: 'ClashDisplay-Medium',
  body: 'Outfit-Regular',
  bodyMedium: 'Outfit-Medium',
  bodySemibold: 'Outfit-SemiBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
} as const;

export const touchTarget = {
  min: 48,
  action: 56,
  cta: 64,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 32,
  hero: 40,
  giant: 52,
  mega: 64,
  ultra: 72,
} as const;
