// Central design tokens — a warm, light theme inspired by Todoist: white surfaces,
// a red brand accent, and flag-style priority colors (red/orange/blue) instead of the
// app's earlier dark purple theme. Every screen reads colors from here so the whole
// app can be restyled by changing values in this one file.
export const colors = {
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F1EE',
  border: '#EBE7E3',
  textPrimary: '#202020',
  textSecondary: '#808080',
  textMuted: '#ACA9A6',
  primary: '#DB4C3F',
  primaryDark: '#C13B2F',
  accent: '#246FE0',
  danger: '#DB4C3F',
  success: '#2FA24C',
  warning: '#EB8909',

  // Text color to use on top of a filled `primary`/`priority` swatch — always white
  // here since every brand/priority color in this theme is dark enough for contrast.
  onColor: '#FFFFFF',

  priority: {
    high: '#DB4C3F',
    medium: '#EB8909',
    low: '#246FE0',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
