import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors, MIN_TOUCH, space } from '@/constants/design-tokens';
import { useTextSize } from '@/context/text-size-context';
import { AppText } from '@/components/ui/app-text';
import { Icon, IconCircle, IconName } from '@/components/ui/app-icon';

interface RowProps {
  label: string;
  description?: string;
  /** Icon in a soft circle at the start of the row. */
  icon?: IconName;
  /** Short text shown on the right, e.g. a phone number. */
  value?: string;
  /** Anything shown on the right instead of `value`, e.g. "Call". */
  accessory?: React.ReactNode;
  /** A small label next to the title, e.g. "Always on". It wraps under the title if there is no room. */
  badge?: React.ReactNode;
  onPress?: () => void;
  /** Shows a › to signal that the row opens another screen. */
  chevron?: boolean;
  destructive?: boolean;
  /** Bold label, for rows that are the main thing in their card. */
  strong?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'switch' | 'text';
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean };
  /** Overrides what a screen reader says. By default: label, description and value. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Row({
  label,
  description,
  icon,
  value,
  accessory,
  badge,
  onPress,
  chevron,
  destructive,
  strong,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  accessibilityHint,
}: RowProps) {
  // At the largest text size there is no room for label and value side by side,
  // so the value moves under the label instead of squeezing it.
  const { scale } = useTextSize();
  const stacked = !!value && !accessory && scale >= 1.5;
  // Screen readers read the row as one item, without the decorative icons.
  const spoken = accessibilityLabel ?? [label, description, value].filter(Boolean).join(', ');

  const content = (
    <>
      {icon ? <IconCircle name={icon} /> : null}
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <AppText
            variant={strong ? 'label' : 'body'}
            color={destructive ? colors.destructive : colors.ink}
            style={[styles.title, strong && styles.strong]}
          >
            {label}
          </AppText>
          {badge}
        </View>
        {stacked ? <AppText color={colors.secondary}>{value}</AppText> : null}
        {description ? <AppText color={colors.secondary} variant={strong ? 'body' : 'footnote'}>{description}</AppText> : null}
      </View>
      {accessory ??
        (value && !stacked ? (
          <AppText color={colors.secondary} style={styles.value}>
            {value}
          </AppText>
        ) : null)}
      {chevron ? (
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Icon name="chevron-right" color={colors.secondary} size={22} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={spoken}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={accessibilityState}
      accessibilityLabel={spoken}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  icon?: IconName;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ label, description, icon, value, onChange, disabled }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      {icon ? <IconCircle name={icon} /> : null}
      <View style={styles.text}>
        <AppText variant="label" style={styles.strong}>
          {label}
        </AppText>
        {description ? <AppText color={colors.secondary}>{description}</AppText> : null}
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
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.rowPressed },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.sm, rowGap: 4 },
  title: { flexShrink: 1 },
  strong: { fontWeight: '700' },
  value: { maxWidth: '50%', textAlign: 'right' },
});
