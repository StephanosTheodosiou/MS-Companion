import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme/theme';
import { Icon, IconName } from './Icon';

/** A round white icon button, e.g. the bell next to "Today". */
export function RoundButton({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={24} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
});
