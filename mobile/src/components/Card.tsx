import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  // No overflow: 'hidden' here, so the shadow stays visible on iPhone.
  card: { backgroundColor: colors.surface, borderRadius: radius.card, ...shadow },
});
