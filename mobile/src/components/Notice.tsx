import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

/** A small note with an icon, e.g. the privacy reminder with a shield. */
export function Note({ icon = 'shield', children }: { icon?: IconName; children: string }) {
  return (
    <View style={styles.note} accessible accessibilityLabel={children}>
      <Icon name={icon} size={20} color={colors.accent} />
      <AppText color={colors.secondary} style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

/** The peach safety card ("In an emergency, call 112."). */
export function SafetyCard({ children }: { children: string }) {
  return (
    <View style={styles.safety} accessible accessibilityLabel={children}>
      <Icon name="alert-circle" size={22} color={colors.warningIcon} />
      <AppText variant="label" color={colors.warningText} style={[styles.flex, styles.safetyText]}>
        {children}
      </AppText>
    </View>
  );
}

/** A red message for something that went wrong, e.g. a failed login. Read out straight away. */
export function ErrorNote({ children }: { children: string }) {
  return (
    <View style={styles.error} accessible accessibilityLabel={children} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Icon name="alert-circle" size={20} color={colors.destructive} />
      <AppText color={colors.destructive} style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

/** A small rounded label, e.g. "Always on" with a lock. */
export function Badge({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <View style={styles.badge}>
      {icon ? <Icon name={icon} size={15} color={colors.accent} /> : null}
      <AppText variant="footnote" color={colors.accent} style={styles.badgeText}>
        {label}
      </AppText>
    </View>
  );
}

/** Dots that show the step in a short sequence (Welcome screen). */
export function PageDots({ index, total }: { index: number; total: number }) {
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={`Step ${index + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingHorizontal: space.xs },
  safety: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.card,
    padding: space.xl,
  },
  safetyText: { fontWeight: '500' },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: '#FDECEA',
    borderRadius: radius.control,
    padding: space.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.track },
  dotActive: { width: 22, backgroundColor: colors.accent },
});
