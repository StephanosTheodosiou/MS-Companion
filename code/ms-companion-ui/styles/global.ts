import { StyleSheet } from 'react-native';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

/**
 * Shared, color-free layout styles. Colors come from `useTheme()` (or ThemedView/ThemedText)
 * so these styles work in both light and dark mode.
 */
export const g = StyleSheet.create({
  /** Full-screen container. */
  screen: {
    flex: 1,
  },
  /** Centered, width-limited content column (looks right on phones, tablets and web). */
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  /** Content inside a tab screen — leaves room for the native tab bar. */
  tabContent: {
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCenterBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
