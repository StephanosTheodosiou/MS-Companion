import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { radius, shadow } from '@/constants/design-tokens';
import { makeStyles } from '@/hooks/use-colors';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = makeStyles((colors) => ({
  // No overflow: 'hidden' here, so the shadow stays visible on iPhone.
  card: { backgroundColor: colors.surface, borderRadius: radius.card, ...shadow },
}));
