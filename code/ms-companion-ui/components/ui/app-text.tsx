import React from 'react';
import { Text, TextProps } from 'react-native';
import { type } from '@/constants/design-tokens';
import { useColors } from '@/hooks/use-colors';
import { useTextSize } from '@/context/text-size-context';

export type TextVariant = keyof typeof type;

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
}

// All text goes through this component so the text-size setting applies everywhere.
export function AppText({ variant = 'body', color, style, children, ...rest }: Props) {
  const colors = useColors();
  const { scale } = useTextSize();
  const { size, weight } = type[variant];
  const fontSize = size * scale;
  const overline = variant === 'overline';
  const defaultColor =
    variant === 'footnote' ? colors.secondary : overline ? colors.overline : colors.ink;
  return (
    <Text
      // The phone's own text-size setting still applies on top of the app's,
      // but is capped so screens stay usable at the largest sizes.
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        {
          fontSize,
          lineHeight: Math.round(fontSize * (overline ? 1.25 : 1.3)),
          fontWeight: weight,
          color: color ?? defaultColor,
          letterSpacing: overline ? 1.1 : variant === 'largeTitle' ? -0.5 : 0,
          textTransform: overline ? 'uppercase' : 'none',
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
