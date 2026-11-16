import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppLogoProps = {
  size?: number;
};

export function AppLogo({ size = 56 }: AppLogoProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="MS Companion"
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: theme.primary, borderRadius: Radius.lg },
      ]}>
      <Icon name="pulse" size={size * 0.5} color={theme.onPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
