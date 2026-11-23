import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Screen } from '@/components/layout/screen';
import { StepHeader } from '@/components/layout/step-header';
import { useProfileForm } from '@/hooks/use-profile-form';
import { completeOnboarding } from '@/utils/storage';

// E1, step 3 of 3: first-time setup. Everything is optional.
export default function ProfileSetupScreen() {
  const router = useRouter();
  const form = useProfileForm();
  useEffect(() => {
    form.load();
  }, [form.load]);

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
      topBar={<StepHeader step={3} total={3} onBack={() => router.back()} />}
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
      }
    >
      {form.fields}
    </Screen>
  );
}
