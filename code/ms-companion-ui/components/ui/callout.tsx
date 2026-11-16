import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CalloutTone = 'info' | 'warning' | 'danger';

export type CalloutProps = {
  tone?: CalloutTone;
  title?: string;
  message: string;
  style?: StyleProp<ViewStyle>;
};

const TONE_ICON: Record<CalloutTone, IconName> = {
  info: 'info',
  warning: 'alert',
  danger: 'alert',
};

export function Callout({ tone = 'info', title, message, style }: CalloutProps) {
  const theme = useTheme();

  const palette = {
    info: { background: theme.primarySoft, icon: theme.primary, text: theme.text },
    warning: { background: theme.warningSoft, icon: theme.warning, text: theme.onWarningSoft },
    danger: { background: theme.dangerSoft, icon: theme.danger, text: theme.text },
  }[tone];

  const isUrgent = tone !== 'info';

  return (
    <View
      accessible
      accessibilityRole={isUrgent ? 'alert' : undefined}
      accessibilityLiveRegion={isUrgent ? 'assertive' : 'polite'}
      style={[styles.container, { backgroundColor: palette.background }, style]}>
      <Icon name={TONE_ICON[tone]} size={18} color={palette.icon} style={styles.icon} />
      <View style={styles.body}>
        {title ? (
          <ThemedText type="calloutStrong" style={{ color: palette.text }}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText type="callout" style={{ color: palette.text }}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: 14,
    borderRadius: Radius.md,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
});
