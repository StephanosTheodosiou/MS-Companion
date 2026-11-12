import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, MIN_TOUCH, radius, space, type } from '../theme/theme';
import { useTextSize } from '../theme/TextSizeContext';
import { AppText } from './AppText';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, multiline, onFocus, onBlur, ...rest }: Props) {
  const { scale } = useTextSize();
  const [focused, setFocused] = useState(false);
  const fontSize = type.body.size * scale;

  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.secondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { fontSize, minHeight: multiline ? MIN_TOUCH * 2 : MIN_TOUCH },
          multiline && styles.multiline,
          focused && { borderColor: colors.accent },
          !!error && { borderColor: colors.destructive },
        ]}
      />
      {error ? (
        <AppText variant="footnote" color={colors.destructive} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="footnote">{hint}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.ink,
  },
  multiline: { textAlignVertical: 'top' },
});
