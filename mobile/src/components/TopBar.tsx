import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BackButton } from './StepHeader';

/** The back button on its own, for full-screen pages that are not part of a step sequence. */
export function TopBar({ onBack, right }: { onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <BackButton onPress={onBack} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
