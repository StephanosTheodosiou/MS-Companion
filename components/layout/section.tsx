import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/constants/design-tokens';
import { makeStyles } from '@/hooks/use-colors';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';

interface Props {
  header?: string;
  footer?: string;
  /** `grouped` puts the children in one white card with dividers; `plain` leaves them as they are. */
  variant?: 'grouped' | 'plain';
  /** Start dividers after the row icons (use when the rows have icons). */
  iconInset?: boolean;
  children: React.ReactNode;
}

// A titled group of rows, like a section in the phone's Settings app.
export function Section({ header, footer, variant = 'grouped', iconInset, children }: Props) {
  const styles = useStyles();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {header ? (
        <AppText variant="overline" accessibilityRole="header" style={styles.header}>
          {header}
        </AppText>
      ) : null}
      {variant === 'grouped' ? (
        <Card>
          <View style={styles.clip}>
            {items.map((child, index) => (
              <React.Fragment key={index}>
                {index > 0 ? (
                  <View style={[styles.divider, { marginLeft: iconInset ? 76 : space.lg }]} />
                ) : null}
                {child}
              </React.Fragment>
            ))}
          </View>
        </Card>
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

const useStyles = makeStyles((colors) => ({
  section: { gap: space.md },
  header: { paddingHorizontal: space.xs },
  clip: { borderRadius: radius.card, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.separator },
  plain: { gap: space.md },
  footerText: { paddingHorizontal: space.xs },
}));
