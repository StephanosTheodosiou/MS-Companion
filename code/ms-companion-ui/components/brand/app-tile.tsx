import React from 'react';
import { View } from 'react-native';
import { radius } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { Icon } from '@/components/ui/app-icon';

/** The teal app tile with the pulse line, shown at the top of Welcome and Log in. */
export function AppTile() {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View
      style={styles.tile}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden>
      <Icon name="activity" size={36} color={colors.onAccent} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  tile: {
    width: 76,
    height: 76,
    borderRadius: radius.card,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
}));
