import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { Screen } from '@/components/layout/screen';
import { Row } from '@/components/ui/row';
import { Section } from '@/components/layout/section';
import { useColors } from '@/hooks/use-colors';
import { useProfileForm } from '@/hooks/use-profile-form';

// E1: the Profile tab, for changing the profile later.
// Medicines have their own screen since E3, so the profile links to it instead of a text field.
export default function ProfileTabScreen() {
  const colors = useColors();
  const router = useRouter();
  const form = useProfileForm();
  const [saved, setSaved] = useState(false);
  useFocusEffect(
    useCallback(() => {
      form.load();
      setSaved(false);
    }, [form.load])
  );

  return (
    <Screen
      inTabs
      scrollRef={form.scrollRef}
      title="Your profile"
      footer={
        <>
          <Button
            label="Save changes"
            onPress={async () => setSaved(await form.save())}
            disabled={form.saving}
          />
          {saved ? (
            <AppText variant="footnote" color={colors.accent} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
              Saved
            </AppText>
          ) : null}
        </>
      }
    >
      {form.fields}
      <Section header="Medicines" iconInset>
        <Row icon="plus-square" label="My medicines and doses" chevron onPress={() => router.push('/medications')} />
      </Section>
    </Screen>
  );
}
