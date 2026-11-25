import React from 'react';
import { Pressable } from 'react-native';
import { radius, shadow } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { Icon, IconName } from '@/components/ui/app-icon';

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
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={24} color={colors.ink} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  button: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
}));
