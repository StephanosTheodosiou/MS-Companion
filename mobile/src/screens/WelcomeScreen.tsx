import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../components/Button';
import { AppTile } from '../components/AppTile';
import { Note, PageDots, SafetyCard } from '../components/Notice';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { StackProps } from '../navigation/types';

// E1: first launch, step 1 of 4. Explains what the app stores before asking for consent.
export function WelcomeScreen({ navigation }: StackProps<'Welcome'>) {
  return (
    <Screen
      header={<AppTile />}
      title="MS Companion"
      subtitle="Record how you feel each day and take a clear summary to your next MS appointment."
      footer={
        <>
          <PageDots index={0} total={4} />
          <View style={styles.gap} />
          <Button label="Create an account" onPress={() => navigation.navigate('Register')} />
          <Button label="I already have an account" variant="plain" onPress={() => navigation.navigate('Login')} />
        </>
      }
    >
      <Section header="What the app stores" iconInset>
        <Row
          icon="clipboard"
          strong
          label="Daily symptom ratings"
          description="Fatigue, mobility, pain, mood, thinking and bladder."
        />
        <Row
          icon="user"
          strong
          label="Your profile"
          description="Type of MS and your MS team's phone number."
        />
        <Row
          icon="bell"
          strong
          label="Optional extras"
          description="Your medicines, reminders and hot-day warnings, only if you allow them."
        />
      </Section>

      <Note>Change your choices or delete your data any time in Settings.</Note>

      <SafetyCard>
        {'MS Companion does not diagnose relapses or give treatment advice.\nIn an emergency, call 112.'}
      </SafetyCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: 12 },
});
