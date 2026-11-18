import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, space } from '../theme/theme';
import { AppText } from './AppText';
import { Icon, IconCircle } from './Icon';

interface Props {
  title: string;
  subtitle: string;
  /** Overdue tests show the subtitle in red. */
  overdue?: boolean;
  /** Shows the "Done" button. Leave out for tests that are already finished. */
  onDone?: () => void;
  /** Opens the test to edit it. */
  onOpen: () => void;
}

// One blood test in the list: tap the text to edit it, or tap "Done" once the test has been taken.
// The "Done" label names the test, so a screen reader does not just say "Done" three times.
export function BloodTestRow({ title, subtitle, overdue, onDone, onOpen }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle}`}
        accessibilityHint="Opens the blood test"
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <IconCircle name="droplet" />
        <View style={styles.text}>
          <AppText variant="label" style={styles.bold}>
            {title}
          </AppText>
          <AppText color={overdue ? colors.destructive : colors.secondary} variant="footnote" style={overdue && styles.bold}>
            {subtitle}
          </AppText>
        </View>
        {onDone ? null : <Icon name="chevron-right" color={colors.secondary} size={22} />}
      </Pressable>
      {onDone ? (
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={`Mark done: ${title}`}
          style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}
        >
          <AppText variant="label" color={colors.onAccent} style={[styles.pillLabel, styles.bold]} textBreakStrategy="simple">
            Done
          </AppText>
        </Pressable>
      ) : null}
    </View>
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
  main: { flex: 1, minWidth: 160, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  bold: { fontWeight: '700' },
  pill: {
    minHeight: 48,
    minWidth: 76,
    paddingHorizontal: space.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginLeft: 'auto',
  },
  pillLabel: { textAlign: 'center', alignSelf: 'stretch' },
});
