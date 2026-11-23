import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { darkColors, lightColors, type ColorPalette } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** A set of named styles, like the object passed to StyleSheet.create. */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** The colour set for the phone's current light/dark setting. */
export function useColors(): ColorPalette {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/**
 * Styles that use colours. Write them once with the colour set as a parameter:
 *
 *   const useStyles = makeStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   // inside the component:
 *   const styles = useStyles();
 *
 * Both versions are created once when the file loads, and the hook picks the one that matches the phone.
 */
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (colors: ColorPalette) => T | NamedStyles<T>,
) {
  const light = StyleSheet.create(factory(lightColors) as T) as T;
  const dark = StyleSheet.create(factory(darkColors) as T) as T;
  return function useStyles(): T {
    return useColorScheme() === 'dark' ? dark : light;
  };
}
