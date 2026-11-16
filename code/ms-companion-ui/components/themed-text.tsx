import { Text, type TextProps } from 'react-native';

import { Typography, type ThemeColor, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /** A step of the type scale in `constants/theme.ts`, or `link` (bold, brand-coloured). */
  type?: TypographyVariant | 'link';
  /** Overrides the colour. Defaults to `text` (`primary` for links). */
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const isLink = type === 'link';
  const color = theme[themeColor ?? (isLink ? 'primary' : 'text')];

  return <Text style={[{ color }, Typography[isLink ? 'bodyStrong' : type], style]} {...rest} />;
}
