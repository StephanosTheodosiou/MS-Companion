// Design tokens: every colour, size and spacing value used by the app lives here.
//
// Based on the team's Figma screens: a calm teal on soft grey, white cards with
// soft shadows and icon circles, and a peach card for safety messages.
// All text colours pass WCAG AA (4.5:1) on the backgrounds they are used on.
export const colors = {
  page: '#F4F6F8',
  surface: '#FFFFFF',
  ink: '#0F1B2A',
  secondary: '#5D6B7A',
  /** Small uppercase section headers (darkened from the mockup for contrast). */
  overline: '#5E6C7A',
  separator: '#E6EAEE',
  inputBorder: '#E1E6EB',
  track: '#CDD6DC',
  muted: '#EEF1F4',
  accent: '#12707B',
  accentPressed: '#0D5961',
  accentSoft: '#E2F1F1',
  onAccent: '#FFFFFF',
  onAccentSoft: '#D9EEEE',
  warningBg: '#FDF0E6',
  warningIcon: '#E8751A',
  warningText: '#7A4520',
  destructive: '#B42318',
  rowPressed: '#F0F3F5',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  control: 16,
  card: 22,
  button: 24,
  pill: 999,
};

// Base sizes in points. AppText multiplies them by the user's text-size setting.
export const type = {
  largeTitle: { size: 34, weight: '800' as const },
  title: { size: 22, weight: '700' as const },
  body: { size: 17, weight: '400' as const },
  label: { size: 17, weight: '600' as const },
  footnote: { size: 14, weight: '400' as const },
  overline: { size: 13, weight: '700' as const },
};

// Smallest comfortable touch target, generous because of tremor and fatigue.
export const MIN_TOUCH = 56;

/** Soft card shadow used across the app. */
export const shadow = {
  shadowColor: '#0F1B2A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
