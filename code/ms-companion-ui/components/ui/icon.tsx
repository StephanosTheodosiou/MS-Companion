import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const ICONS = {
  alert: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  person: { ios: 'person', android: 'person', web: 'person' },
  pulse: { ios: 'waveform.path.ecg', android: 'vital_signs', web: 'vital_signs' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 20, color, style }: IconProps) {
  const theme = useTheme();

  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color ?? theme.textSecondary}
      style={[{ width: size, height: size }, style]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
