import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '../components/Button';
import { IconName } from '../components/Icon';
import { Badge, Note } from '../components/Notice';
import { Row, SwitchRow } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { StepHeader } from '../components/StepHeader';
import { StackProps } from '../navigation/types';
import { getConsents, saveAllConsents } from '../services/storage';
import { ConsentKey, ConsentMap } from '../types';

export const OPTIONAL_CONSENTS: {
  key: Exclude<ConsentKey, 'symptoms'>;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  { key: 'medication', label: 'Medication', description: 'Your medicine list and dose reminders.', icon: 'plus-square' },
  { key: 'notifications', label: 'Reminders', description: 'A daily nudge to fill in your check-in.', icon: 'bell' },
  { key: 'location', label: 'Location', description: 'Only used to warn you about hot days.', icon: 'map-pin' },
];

// E1, step 2 of 3: one switch per data type. Only symptom data is required for the app to work.
// This screen stores the user's choice. The phone's own permission prompts
// (notifications, location) come later, with the features that need them.
export function ConsentScreen({ navigation }: StackProps<'Consent'>) {
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
      navigation.navigate('Profile');
    } catch (e) {
      console.warn('Could not save consents', e);
      Alert.alert('Your choices were not saved', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      topBar={<StepHeader step={2} total={3} onBack={() => navigation.goBack()} />}
      title="Your data, your choice"
      subtitle="Choose what the app may use. You can change this later in Settings."
      footer={<Button label="Continue" onPress={onContinue} disabled={saving} />}
    >
      <Section footer="The app needs these to work. To stop them, delete your data in Settings.">
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
