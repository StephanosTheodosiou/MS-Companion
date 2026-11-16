import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, MIN_TOUCH, radius, shadow, space, type } from '../theme/theme';
import { useTextSize } from '../theme/TextSizeContext';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Icon inside the field, at the start. */
  icon?: IconName;
  hint?: string;
  error?: string | null;
  /** Something inside the field on the right, e.g. a show-password button. */
  trailing?: React.ReactNode;
}

export function TextField({ label, icon, hint, error, trailing, multiline, onFocus, onBlur, ...rest }: Props) {
  const { scale } = useTextSize();
  const [focused, setFocused] = useState(false);
  const fontSize = type.body.size * scale;
  // Multi-line fields have room for two lines (three at larger text sizes), so example text is never cut off.
  const multiHeight = Math.round(fontSize * 1.3 * (scale > 1 ? 3 : 2) + 2 * space.md + 4);

  return (
    <View style={styles.wrap}>
      <AppText variant="overline" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          { minHeight: multiline ? multiHeight : MIN_TOUCH },
          multiline && styles.boxMultiline,
          focused && { borderColor: colors.accent },
          !!error && { borderColor: colors.destructive },
        ]}
      >
        {icon ? (
          <View style={multiline ? styles.iconTop : undefined} importantForAccessibility="no-hide-descendants">
            <Icon name={icon} color={colors.secondary} size={20} />
          </View>
        ) : null}
        <TextInput
          {...rest}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityHint={hint ?? rest.placeholder}
          placeholderTextColor={colors.secondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { fontSize }, multiline && styles.multiline, multiline && { minHeight: multiHeight - 2 * space.md }]}
        />
        {trailing}
      </View>
      {error ? (
        <AppText variant="footnote" color={colors.destructive} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="footnote">{hint}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { paddingHorizontal: space.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    ...shadow,
    shadowOpacity: 0.03,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: space.md },
  iconTop: { paddingTop: 2 },
  input: { flex: 1, color: colors.ink, paddingVertical: space.md },
  multiline: { textAlignVertical: 'top', paddingTop: 0 },
});
