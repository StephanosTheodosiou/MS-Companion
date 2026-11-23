import React from 'react';
import { View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

// One place for icons. Mostly Feather (thin outline icons, as in the Figma screens);
// two symptoms have no Feather icon, so they use the matching outline icon from another set.
export type IconName = React.ComponentProps<typeof Feather>['name'] | 'mci:walk' | 'mci:brain';

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  color ??= colors.accent;
  if (name.startsWith('mci:')) {
    const mci = name.slice(4) as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    return <MaterialCommunityIcons name={mci} size={size + 2} color={color} />;
  }
  return <Feather name={name as React.ComponentProps<typeof Feather>['name']} size={size} color={color} />;
}

/** An icon in a soft teal circle, used at the start of rows and above titles. */
export function IconCircle({ name, size = 44 }: { name: IconName; size?: number }) {
  const colors = useColors();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.48)} />
    </View>
  );
}
