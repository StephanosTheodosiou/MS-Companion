import React, { useState, type Ref } from 'react';
import { TextInput, TextInputProps, View, type TextInputInstance } from 'react-native';
import { MIN_TOUCH, radius, shadow, space, type } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { useTextSize } from '@/context/text-size-context';
import { AppText } from '@/components/ui/app-text';
import { Icon, IconName } from '@/components/ui/app-icon';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Icon inside the field, at the start. */
  icon?: IconName;
  hint?: string;
  error?: string | null;
  /** Something inside the field on the right, e.g. a show-password button. */
  trailing?: React.ReactNode;
  ref?: Ref<TextInputInstance>;
}

export function TextField({
  ref,
  label,
  icon,
  hint,
  error,
  trailing,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const styles = useStyles();
  const colors = useColors();
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
        ]}>
        {icon ? (
          <View
            style={multiline ? styles.iconTop : undefined}
            importantForAccessibility="no-hide-descendants">
            <Icon name={icon} color={colors.secondary} size={20} />
          </View>
        ) : null}
        <TextInput
          {...rest}
          ref={ref}
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
          style={[
            styles.input,
            { fontSize },
            multiline && styles.multiline,
            multiline && { minHeight: multiHeight - 2 * space.md },
          ]}
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

const useStyles = makeStyles((colors) => ({
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
}));
