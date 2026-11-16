import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, space } from '../theme/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  step: number;
  total: number;
  onBack?: () => void;
  /**
   * `setup`: short bars in the middle and "2 of 3" on the right (first-time setup).
   * `flow`: "Step 1 of 7" in the middle and full-width bars underneath (check-in).
   */
  variant?: 'setup' | 'flow';
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
    >
      <Icon name="arrow-left" color={colors.ink} size={24} />
    </Pressable>
  );
}

function Bars({ step, total, short }: { step: number; total: number; short?: boolean }) {
  return (
    <View
      style={[styles.bars, short && styles.barsShort]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.bar, short && styles.barShort, { backgroundColor: i < step ? colors.accent : colors.track }]}
        />
      ))}
    </View>
  );
}

export function StepHeader({ step, total, onBack, variant = 'setup' }: Props) {
  const back = onBack ? <BackButton onPress={onBack} /> : <View style={styles.backSpace} />;
  if (variant === 'flow') {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          {back}
          <AppText variant="label" color={colors.secondary} style={styles.center}>
            Step {step} of {total}
          </AppText>
          <View style={styles.backSpace} />
        </View>
        <Bars step={step} total={total} />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {back}
      <View style={styles.centerWrap}>
        <Bars step={step} total={total} short />
      </View>
      <AppText variant="body" color={colors.secondary} style={styles.count}>
        {step} of {total}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  backSpace: { width: 52, height: 52 },
  center: { flex: 1, textAlign: 'center' },
  centerWrap: { flex: 1, alignItems: 'center' },
  count: { minWidth: 52, textAlign: 'right' },
  bars: { flexDirection: 'row', gap: 6 },
  barsShort: { width: 110 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  barShort: { height: 5 },
});
