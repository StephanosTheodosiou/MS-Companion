import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/constants/design-tokens';
import { AppText } from '@/components/ui/app-text';

interface Props {
  value: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}

const BAR_HEIGHTS = [10, 16, 22, 28];

// One answer of the 0-4 scale: number, words and a small level graphic.
export function RatingOption({ value, label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${value}, ${label}`}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && !selected && styles.pressed]}
    >
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <AppText variant="label" color={selected ? colors.onAccent : colors.secondary} style={styles.bold}>
          {value}
        </AppText>
      </View>
      <AppText variant="label" color={selected ? colors.accent : colors.ink} style={[styles.label, selected && styles.bold]}>
        {label}
      </AppText>
      <View style={styles.bars} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {BAR_HEIGHTS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: h, backgroundColor: i < value ? (selected ? colors.accent : '#A6B4BE') : colors.separator },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow,
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pressed: { backgroundColor: colors.rowPressed },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: colors.accent },
  label: { flex: 1, fontWeight: '600' },
  bold: { fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  bar: { width: 9, borderRadius: 3 },
});
