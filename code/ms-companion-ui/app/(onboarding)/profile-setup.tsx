import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Screen } from '@/components/layout/screen';
import { StepHeader } from '@/components/layout/step-header';
import { SETUP_STEPS } from '@/constants/onboarding';
import { useProfileForm } from '@/hooks/use-profile-form';
import { completeOnboarding } from '@/utils/storage';

// E1, step 4 of 4: first-time setup. Everything is optional.
export default function ProfileSetupScreen() {
  const router = useRouter();
  const form = useProfileForm();
  const { load } = form;
  useEffect(() => {
    load();
  }, [load]);

  const finish = async () => {
    try {
      await completeOnboarding();
      router.replace('/home');
    } catch (e) {
      console.warn('Could not finish setup', e);
      Alert.alert('Setup was not finished', 'Please try again.');
    }
  };

  return (
    <Screen
      scrollRef={form.scrollRef}
      topBar={<StepHeader
          step={SETUP_STEPS.profile}
          total={SETUP_STEPS.total}
          onBack={() => router.back()}
        />}
      title="About you"
      subtitle="This prepares your visit summary. Everything here is optional and you can add it later."
      footer={
        <>
          <Button
            label="Finish setup"
            onPress={async () => {
              if (await form.save()) await finish();
            }}
            disabled={form.saving}
          />
          <Button label="Skip for now" variant="plain" onPress={finish} />
        </>
      }>
      {form.fields}
    </Screen>
  );
}
