import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/theme';
import { AppText } from './AppText';

interface Props {
  header?: string;
  footer?: string;
  /** `grouped` puts the children in one white block with dividers; `plain` leaves them as they are. */
  variant?: 'grouped' | 'plain';
  children: React.ReactNode;
}

// A titled group of rows, like a section in the phone's Settings app.
export function Section({ header, footer, variant = 'grouped', children }: Props) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {header ? (
        <AppText variant="footnote" accessibilityRole="header" style={styles.header}>
          {header}
        </AppText>
      ) : null}
      {variant === 'grouped' ? (
        <View style={styles.group}>
          {items.map((child, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <View style={styles.divider} /> : null}
              {child}
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View style={styles.plain}>{items}</View>
      )}
      {footer ? (
        <AppText variant="footnote" style={styles.footerText}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  header: { fontWeight: '600', paddingHorizontal: space.xs },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.group,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: space.lg,
  },
  plain: { gap: space.xl },
  footerText: { paddingHorizontal: space.xs },
});
