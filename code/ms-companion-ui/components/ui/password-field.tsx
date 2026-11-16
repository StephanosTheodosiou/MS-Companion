import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { TextField, type TextFieldProps } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';

export type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'trailing'>;

export function PasswordField({ leadingIcon = 'lock', ...rest }: PasswordFieldProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      leadingIcon={leadingIcon}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      {...rest}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          onPress={() => setVisible((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={4}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
          <Icon name={visible ? 'eyeOff' : 'eye'} color={theme.textSecondary} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 40,
    height: 40,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
