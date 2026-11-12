import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';
import { AppText } from './AppText';

interface Props {
  /** 1-based current step. */
  step: number;
  total: number;
}

export function ProgressBar({ step, total }: Props) {
  const percent = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <View style={styles.wrap}>
      <AppText variant="footnote">
        Step {step} of {total}
      </AppText>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
});
