import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, MIN_TOUCH, radius, space } from '../theme/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  /**
   * `primary` is the one main action on a screen; `plain` is a quiet text button;
   * `light` is a white button for use on a teal card.
   */
  variant?: 'primary' | 'plain' | 'light';
  disabled?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, accessibilityHint }: Props) {
  const textColor = variant === 'primary' ? colors.onAccent : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        variant === 'light' && { backgroundColor: pressed ? colors.accentSoft : colors.surface },
        variant === 'plain' && pressed && { opacity: 0.6 },
        disabled && styles.disabled,
      ]}
    >
      <AppText
        variant="label"
        color={textColor}
        // Full button width: on some Android phones bold text is measured too
        // narrow and the last word was cut off.
        style={styles.label}
        textBreakStrategy="simple"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.button,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center', alignSelf: 'stretch', fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
