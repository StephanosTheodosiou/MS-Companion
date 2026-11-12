import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Row, SwitchRow } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { RootStackParamList } from '../navigation/types';
import { getConsents, saveAllConsents } from '../services/storage';
import { ConsentKey, ConsentMap } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

export const OPTIONAL_CONSENTS: {
  key: Exclude<ConsentKey, 'symptoms'>;
  label: string;
  description: string;
}[] = [
  { key: 'medication', label: 'Medication', description: 'Your medicine list and dose reminders.' },
  { key: 'notifications', label: 'Reminders', description: 'A daily nudge to fill in your check-in.' },
  { key: 'location', label: 'Location', description: 'Only used to warn you about hot days.' },
];

// E1: one switch per data type. Only symptom data is required for the app to work.
// This screen stores the user's choice. The phone's own permission prompts
// (notifications, location) come later, with the features that need them.
export function ConsentScreen({ navigation }: Props) {
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
    try {
      await saveAllConsents({ ...consents, symptoms: true });
      navigation.navigate('Profile', { onboarding: true });
    } catch (e) {
      console.warn('Could not save consents', e);
      Alert.alert('Your choices were not saved', 'Check your phone and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Your data, your choice"
      subtitle="Choose what the app may use. You can change this later in Settings."
      footer={<Button label="Continue" onPress={onContinue} disabled={saving} />}
    >
      <Section footer="The app needs these to work. To stop them, delete your data in Settings.">
        <Row
          label="Symptom check-ins"
          description="Daily ratings of how you feel."
          value="Always on"
        />
      </Section>

      <Section header="Optional">
        {OPTIONAL_CONSENTS.map((item) => (
          <SwitchRow
            key={item.key}
            label={item.label}
            description={item.description}
            value={consents[item.key]}
            onChange={(value) => setConsents((c) => ({ ...c, [item.key]: value }))}
          />
        ))}
      </Section>
    </Screen>
  );
}
