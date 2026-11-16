import { useState, type ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Sizes, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Validation message. Turns the field red and is read out by screen readers. */
  error?: string;
  /** Helper text under the field, hidden while an error is shown. */
  hint?: string;
  leadingIcon?: IconName;
  /** Rendered inside the field on the right, e.g. a show/hide password button. */
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<TextInputInstance>;
};

export function TextField({
  label,
  error,
  hint,
  leadingIcon,
  trailing,
  containerStyle,
  ref,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.borderStrong;
  const ringColor = error ? theme.dangerSoft : theme.primarySoft;

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>

      <View
        style={[
          styles.field,
          { backgroundColor: theme.surface, borderColor },
          focused && { boxShadow: `0px 0px 0px 3px ${ringColor}` },
          !editable && styles.disabled,
        ]}>
        {leadingIcon ? (
          <Icon name={leadingIcon} size={18} color={focused ? theme.primary : theme.textMuted} />
        ) : null}

        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          aria-invalid={error ? true : undefined}
          editable={editable}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          style={[styles.input, { color: theme.text }]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />

        {trailing}
      </View>

      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="alert" size={14} color={theme.danger} />
          <ThemedText type="caption" themeColor="danger" style={styles.messageText}>
            {error}
          </ThemedText>
        </View>
      ) : hint ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  field: {
    minHeight: Sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    ...Typography.body,
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    outlineWidth: 0,
  },
  disabled: {
    opacity: 0.6,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  messageText: {
    flex: 1,
  },
});
