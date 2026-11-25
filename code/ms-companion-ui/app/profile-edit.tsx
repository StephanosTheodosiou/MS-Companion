import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Screen } from '@/components/layout/screen';
import { TopBar } from '@/components/layout/top-bar';
import { useProfileForm } from '@/hooks/use-profile-form';

export default function ProfileEditScreen() {
  const router = useRouter();
  const form = useProfileForm();
  const { load } = form;

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (await form.save()) router.back();
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      scrollRef={form.scrollRef}
      title="About me"
      subtitle="Shown on your visit summary. The phone number powers the Call button on Home."
      footer={<Button label="Save" onPress={onSave} disabled={form.saving} />}>
      {form.fields}
    </Screen>
  );
}
