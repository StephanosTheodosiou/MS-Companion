import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, MIN_TOUCH, space } from '../theme/theme';
import { AppText } from './AppText';

interface RowProps {
  label: string;
  description?: string;
  /** Short text shown on the right, e.g. a phone number. */
  value?: string;
  /** Anything shown on the right instead of `value`, e.g. a switch or a check mark. */
  accessory?: React.ReactNode;
  onPress?: () => void;
  /** Shows a › to signal that the row opens another screen. */
  chevron?: boolean;
  destructive?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'switch' | 'text';
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean };
}

export function Row({
  label,
  description,
  value,
  accessory,
  onPress,
  chevron,
  destructive,
  accessibilityRole,
  accessibilityState,
}: RowProps) {
  const content = (
    <>
      <View style={styles.text}>
        <AppText color={destructive ? colors.destructive : colors.ink}>{label}</AppText>
        {description ? <AppText variant="footnote">{description}</AppText> : null}
      </View>
      {accessory ?? (value ? <AppText color={colors.secondary}>{value}</AppText> : null)}
      {chevron ? (
        <AppText color={colors.secondary} style={styles.chevron}>
          ›
        </AppText>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ label, description, value, onChange, disabled }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText>{label}</AppText>
        {description ? <AppText variant="footnote">{description}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.track, true: colors.accent }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.track}
        accessibilityLabel={label}
        accessibilityHint={description}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.rowPressed },
  text: { flex: 1, gap: 2 },
  chevron: { fontSize: 24, lineHeight: 26 },
});
