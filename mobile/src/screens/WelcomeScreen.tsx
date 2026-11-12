import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

// E1: first launch. Explains what the app stores before asking for consent.
export function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen
      noHeader
      title="MS Companion"
      subtitle="Record how you feel each day and take a clear summary to your next MS appointment."
      footer={<Button label="Continue" onPress={() => navigation.navigate('Consent')} />}
    >
      <Section
        header="What the app stores"
        footer="You can change your choices or delete your data at any time in Settings."
      >
        <Row
          label="Daily symptom ratings"
          description="Fatigue, mobility, pain, mood, thinking and bladder."
        />
        <Row
          label="Your profile"
          description="Type of MS, medication and your MS team's phone number."
        />
        <Row
          label="Optional extras"
          description="Reminders, and your location for hot-day warnings, only if you allow them."
        />
      </Section>

      <AppText variant="footnote">
        MS Companion does not diagnose relapses or give treatment advice. In an emergency, call 112.
      </AppText>
    </Screen>
  );
}
