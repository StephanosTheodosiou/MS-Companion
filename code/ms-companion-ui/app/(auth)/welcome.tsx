import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { AppTile } from '@/components/brand/app-tile';
import { Note, PageDots, SafetyCard } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';

// E1: first launch, step 1 of 4. Explains what the app stores before asking for consent.
export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen
      header={<AppTile />}
      title="MS Companion"
      subtitle="Record how you feel each day and take a clear summary to your next MS appointment."
      footer={
        <>
          <PageDots index={0} total={4} />
          <View style={styles.gap} />
          <Button label="Create an account" onPress={() => router.push('/register')} />
          <Button
            label="I already have an account"
            variant="plain"
            onPress={() => router.push('/login')}
          />
        </>
      }>
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
        {
          'MS Companion does not diagnose relapses or give treatment advice.\nIn an emergency, call 112.'
        }
      </SafetyCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: 12 },
});
