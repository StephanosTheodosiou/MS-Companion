// Design tokens: every colour, size and spacing value used by the app lives here.
//
// Direction: calm and native-feeling. Grouped lists on a soft page (like a phone's own
// Settings app), one accent colour, hierarchy from type and spacing instead of boxes.
//
// Palette: a muted, calm blue on soft blue-grey neutrals. Blue reads as calm and
// trustworthy for a health app, and low saturation is easier on tired eyes (fatigue and
// vision problems are common in MS).
export const colors = {
  page: '#F3F5F8',
  surface: '#FFFFFF',
  ink: '#1D2733',
  secondary: '#5A6675',
  separator: '#E1E6EC',
  inputBorder: '#C5CED8',
  track: '#E3E8EE',
  accent: '#45709F',
  accentPressed: '#385C84',
  destructive: '#B42318',
  onAccent: '#FFFFFF',
  rowPressed: '#EBEFF4',
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
  control: 10,
  group: 12,
};

// Base sizes in points. AppText multiplies them by the user's text-size setting.
export const type = {
  largeTitle: { size: 32, weight: '700' as const },
  title: { size: 20, weight: '600' as const },
  body: { size: 17, weight: '400' as const },
  label: { size: 17, weight: '600' as const },
  footnote: { size: 14, weight: '400' as const },
};

// Smallest comfortable touch target, generous because of tremor and fatigue.
export const MIN_TOUCH = 52;
