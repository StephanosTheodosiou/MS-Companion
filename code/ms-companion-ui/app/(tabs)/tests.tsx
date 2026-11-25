import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Badge, Note } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { space } from '@/constants/design-tokens';
import { useColors } from '@/hooks/use-colors';

// E4 Quick function tests: not built yet (planned "only if ahead" in Sprint 6).
// The tab shows what is coming so it does not look broken. Rows have no onPress until the tests exist.
export default function TestsScreen() {
  const colors = useColors();
  return (
    <Screen
      inTabs
      title="Tests"
      subtitle="Short tests on your phone that show how your hands and thinking are doing over time.">
      <View style={{ alignSelf: 'flex-start' }}>
        <Badge icon="clock" label="Coming soon" />
      </View>

      <Section header="Planned tests" iconInset>
        <Row
          icon="target"
          label="Tapping test"
          description="Tap the screen as fast as you can for 10 seconds, with each hand."
          accessibilityRole="text"
        />
        <Row
          icon="edit-3"
          label="Drawing test"
          description="Trace a shape with your finger to check hand steadiness."
          accessibilityRole="text"
        />
        <Row
          icon="grid"
          label="Symbol matching"
          description="Match symbols to numbers for 90 seconds to check processing speed."
          accessibilityRole="text"
        />
      </Section>

      <AppText variant="footnote" color={colors.secondary} style={{ paddingHorizontal: space.xs }}>
        Your results will appear in your visit summary, next to your check-ins.
      </AppText>

      <Note icon="info">These tests track changes over time. They do not diagnose anything.</Note>
    </Screen>
  );
}
