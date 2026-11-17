import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, space } from '../theme/theme';
import { DoseStatus } from '../types';
import { AppText } from './AppText';
import { IconCircle } from './Icon';

interface Props {
  title: string;
  subtitle: string;
  status: DoseStatus | null;
  onLog: (status: DoseStatus) => void;
  onUndo: () => void;
}

// One scheduled dose for today: two clear choices, or the result with an undo.
// Button labels name the medicine, so a screen reader does not just say "Taken" three times.
export function DoseRow({ title, subtitle, status, onLog, onUndo }: Props) {
  const spoken = `${title}, ${subtitle}`;
  return (
    <View style={styles.row}>
      <IconCircle name={status === 'taken' ? 'check' : 'clock'} />
      <View style={styles.text}>
        <AppText variant="label" style={styles.bold}>
          {title}
        </AppText>
        <AppText color={colors.secondary} variant="footnote">
          {subtitle}
        </AppText>
      </View>
      {status ? (
        <View style={styles.actions}>
          <AppText variant="label" color={status === 'taken' ? colors.accent : colors.secondary} style={styles.bold}>
            {status === 'taken' ? 'Taken' : 'Skipped'}
          </AppText>
          <Pill label="Undo" spoken={`Undo: ${spoken}`} onPress={onUndo} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Pill label="Skip" spoken={`Skip: ${spoken}`} onPress={() => onLog('skipped')} />
          <Pill label="Taken" spoken={`Taken: ${spoken}`} onPress={() => onLog('taken')} filled />
        </View>
      )}
    </View>
  );
}

function Pill({ label, spoken, onPress, filled }: { label: string; spoken: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      style={({ pressed }) => [styles.pill, filled ? styles.pillFilled : styles.pillPlain, pressed && { opacity: 0.7 }]}
    >
      <AppText
        variant="label"
        color={filled ? colors.onAccent : colors.accent}
        style={[styles.pillLabel, styles.bold]}
        textBreakStrategy="simple"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, minWidth: 120, gap: 2 },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: 'auto' },
  pill: {
    minHeight: 48,
    minWidth: 76,
    paddingHorizontal: space.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { textAlign: 'center', alignSelf: 'stretch' },
  pillFilled: { backgroundColor: colors.accent },
  pillPlain: { backgroundColor: colors.accentSoft },
});
