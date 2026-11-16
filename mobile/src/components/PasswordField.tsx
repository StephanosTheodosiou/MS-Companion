import React, { useState } from 'react';
import { Pressable, TextInputProps } from 'react-native';
import { colors } from '../theme/theme';
import { Icon } from './Icon';
import { TextField } from './TextField';

interface Props extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  hint?: string;
  error?: string | null;
  /** `new` for creating an account (the phone may suggest a strong password), `current` for logging in. */
  kind: 'new' | 'current';
}

// A password field with a button to show what was typed, which helps with tremor and typos.
export function PasswordField({ kind, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...rest}
      icon="lock"
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={kind === 'new' ? 'new-password' : 'current-password'}
      textContentType={kind === 'new' ? 'newPassword' : 'password'}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={12}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={22} color={colors.secondary} />
        </Pressable>
      }
    />
  );
}
