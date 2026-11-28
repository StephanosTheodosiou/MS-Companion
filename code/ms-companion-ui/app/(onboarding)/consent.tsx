import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Badge, Note } from '@/components/ui/notice';
import { Row, SwitchRow } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { StepHeader } from '@/components/layout/step-header';
import { SETUP_STEPS } from '@/constants/onboarding';
import { getConsents, saveAllConsents } from '@/utils/storage';
import { OPTIONAL_CONSENTS } from '@/constants/consent';
import { useAuth } from '@/context/auth-context';
import { ConsentMap } from '@/types/health';
import { ApiError } from '@/utils/apiClient';
import { pushConsents } from '@/utils/patientApi';

// E1, step 3 of 4: one switch per data type. Only symptom data is required for the app to work.
// The choices are saved on the phone and recorded on the server (POST /api/consent, N4).
// The server's record also tells the app that this step is done (see app/index.tsx).
// The phone's own permission prompts (notifications, location) come later, with the features that need them.
export default function ConsentScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [consents, setConsents] = useState<ConsentMap>({
    symptoms: true,
    medication: false,
    location: false,
    notifications: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConsents()
      .then((saved) => setConsents({ ...saved, symptoms: true }))
      .catch((e) => console.warn('Could not load consents', e));
  }, []);

  const onContinue = async () => {
    setSaving(true);
    const choices = { ...consents, symptoms: true };
    try {
      await saveAllConsents(choices);
      await pushConsents(choices);
      router.push('/profile-setup');
    } catch (e) {
      console.warn('Could not save consents', e);
      const offline = e instanceof ApiError && e.isNetworkError;
      Alert.alert(
        'Your choices were not saved',
        offline
          ? "MS Companion couldn't be reached. Check your internet connection and try again."
          : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // F15: the account already exists here, so "back" cannot go to Create account. It means leaving
  // setup, which logs out; ask first instead of logging out without a word.
  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    Alert.alert(
      'Leave setup?',
      "You'll be logged out. Your account is kept, and you can finish setup when you log in again.",
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => signOut() },
      ],
    );
  };

  return (
    <Screen
      topBar={
        <StepHeader step={SETUP_STEPS.consent} total={SETUP_STEPS.total} onBack={onBack} />
      }
      title="Your data, your choice"
      subtitle="Your account is ready. Now choose what the app may use. You can change this later in Profile."
      footer={<Button label="Continue" onPress={onContinue} disabled={saving} />}>
      <Section footer="The app needs these to work. To stop them, delete your data in Profile.">
        <Row
          icon="clipboard"
          strong
          label="Symptom check-ins"
          description="Daily ratings of how you feel."
          badge={<Badge icon="lock" label="Always on" />}
          accessibilityLabel="Symptom check-ins, daily ratings of how you feel. Always on."
        />
      </Section>

      <Section header="Optional" iconInset>
        {OPTIONAL_CONSENTS.map((item) => (
          <SwitchRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            description={item.description}
            value={consents[item.key]}
            onChange={(value) => setConsents((c) => ({ ...c, [item.key]: value }))}
          />
        ))}
      </Section>

      <Note>You can withdraw any choice at any time.</Note>
    </Screen>
  );
}
