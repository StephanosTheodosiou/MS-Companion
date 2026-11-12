import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, type } from '../theme/theme';
import { useTextSize } from '../theme/TextSizeContext';

export type TextVariant = keyof typeof type;

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
}

// All text goes through this component so the text-size setting applies everywhere.
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const { scale } = useTextSize();
  const { size, weight } = type[variant];
  const fontSize = size * scale;
  const defaultColor = variant === 'footnote' ? colors.secondary : colors.ink;
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize,
          lineHeight: Math.round(fontSize * 1.3),
          fontWeight: weight,
          color: color ?? defaultColor,
        },
        style,
      ]}
    />
  );
}
