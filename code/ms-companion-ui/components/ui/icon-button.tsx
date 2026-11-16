import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Sizes } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: IconName;
  accessibilityLabel: string;
};

export function IconButton({ icon, style, ...rest }: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={(state) => [
        styles.base,
        {
          backgroundColor: state.pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Icon name={icon} size={18} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: Sizes.iconButton,
    height: Sizes.iconButton,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
