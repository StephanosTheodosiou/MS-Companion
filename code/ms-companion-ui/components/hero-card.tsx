import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/constants/design-tokens';
import { AppText } from '@/components/ui/app-text';

interface Props {
  overline: string;
  title: string;
  subtitle: string;
  /** Usually a `light` Button. */
  action?: React.ReactNode;
}

// The teal card at the top of Today, with two soft decorative circles.
export function HeroCard({ overline, title, subtitle, action }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.circle, styles.circleOne]} importantForAccessibility="no" />
      <View style={[styles.circle, styles.circleTwo]} importantForAccessibility="no" />
      <View style={styles.text}>
        <AppText variant="overline" color={colors.onAccentSoft}>
          {overline}
        </AppText>
        <AppText variant="title" color={colors.onAccent} accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <AppText color={colors.onAccentSoft}>{subtitle}</AppText>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accent,
    borderRadius: radius.card + 4,
    padding: space.xl,
    paddingTop: space.xxl,
    overflow: 'hidden',
    gap: space.xxl,
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  circleOne: { width: 220, height: 220, top: -70, right: -60 },
  circleTwo: { width: 160, height: 160, top: 60, right: -90 },
  text: { gap: space.sm },
  title: { fontWeight: '800' },
  action: {},
});
