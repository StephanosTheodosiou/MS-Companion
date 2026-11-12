import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, MIN_TOUCH, radius, space } from '../theme/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  /** `primary` is the one main action on a screen; `plain` is a quiet text button. */
  variant?: 'primary' | 'plain';
  disabled?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, accessibilityHint }: Props) {
  const primary = variant === 'primary';
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
        primary && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        !primary && pressed && { opacity: 0.6 },
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="label" color={primary ? colors.onAccent : colors.accent} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.group,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
  disabled: { opacity: 0.5 },
});
