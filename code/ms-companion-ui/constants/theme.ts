import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    // Surfaces
    background: '#F4F6F8', // app canvas
    surface: '#FFFFFF', // cards, inputs, sheets
    surfaceMuted: '#ECF0F3', // pressed rows, inactive tracks
    border: '#E2E8ED', // card outlines, dividers
    borderStrong: '#CBD5DC', // input outlines, "off" switch track

    // Text
    text: '#0B1A2A',
    textSecondary: '#5F6F7D', // supporting copy and field labels (4.8:1 on background)
    textMuted: '#8B98A4', // placeholders and decoration only (fails AA for body text)

    // Brand
    primary: '#0F6E7A',
    primaryPressed: '#0B5862',
    primarySoft: '#E1F0F1', // icon tiles, chips, selected rows, focus ring
    onPrimary: '#FFFFFF',

    // Feedback
    danger: '#C0392B',
    dangerSoft: '#FDEDEC',
    warning: '#EA7D2E',
    warningSoft: '#FFF1E5',
    onWarningSoft: '#704928',
    success: '#1F8A5B',
    successSoft: '#E5F4EC',
  },
  dark: {
    background: '#0B141B',
    surface: '#15212A',
    surfaceMuted: '#1D2B35',
    border: '#253541',
    borderStrong: '#3A4D5B',

    text: '#E9EFF3',
    textSecondary: '#A4B2BE',
    textMuted: '#7D8C99',

    primary: '#5DBAC6',
    primaryPressed: '#4AA5B1',
    primarySoft: '#16363C',
    onPrimary: '#05252A',

    danger: '#F28B82',
    dangerSoft: '#3B1F1E',
    warning: '#F29A55',
    warningSoft: '#33251A',
    onWarningSoft: '#F6CDA8',
    success: '#5CC594',
    successSoft: '#173326',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;


export const Typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  callout: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  calloutStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12, // buttons, inputs
  lg: 16, // cards
  xl: 20,
  pill: 999,
} as const;

/** Fixed component sizes, so controls line up across screens. */
export const Sizes = {
  control: 52,
  iconTile: 40,
  iconButton: 40,
} as const;

export const Shadows = {
  card: { boxShadow: '0px 4px 12px rgba(11, 26, 42, 0.06)' },
  raised: { boxShadow: '0px 6px 20px rgba(11, 26, 42, 0.10)' },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const MaxFormWidth = 440;
