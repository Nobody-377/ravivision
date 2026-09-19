export const COLORS = {
  primary: '#0d52bf',
  primaryHover: '#0a439e',
  accent: '#1a73e8',
  accentLight: '#e8f0fe',

  surfaceWhite: '#ffffff',
  surfaceGround: '#f8fafc',
  surfaceCard: '#ffffff',
  surfaceSubtle: '#f1f5f9',

  textHeading: '#0f172a',
  textBody: '#334155',
  textMuted: '#64748b',
  textLight: '#94a3b8',

  borderLight: '#e2e8f0',
  borderStrong: '#cbd5e1',

  statusSuccess: '#16a34a',
  statusSuccessBg: '#f0fdf4',
  statusWarning: '#ea580c',
  statusWarningBg: '#fff7ed',
  statusDanger: '#dc2626',
  statusDangerBg: '#fef2f2',
  statusInfo: '#0284c7',
  statusInfoBg: '#f0f9ff',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADII = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0d52bf',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0d52bf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const TYPOGRAPHY = {
  fontFamily: 'System',
  headingLarge: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.textHeading,
  },
  headingMedium: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textHeading,
  },
  headingSmall: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.textHeading,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textBody,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: COLORS.textMuted,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: COLORS.textLight,
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  priceLarge: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: COLORS.primary,
  },
};
