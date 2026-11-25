import React, { useCallback, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Row, SwitchRow } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useAuth } from '@/context/auth-context';
import { deleteAllData, exportAllData, getConsents, setConsent } from '@/utils/storage';
import { useTextSize } from '@/context/text-size-context';
import { ConsentKey, ConsentMap, TextSize } from '@/types/health';
import { OPTIONAL_CONSENTS } from '@/constants/consent';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Largest' },
];

// E1, Settings tab: text size, withdrawing consent, and exporting or deleting data (GDPR).
export default function SettingsScreen() {
  const { size, setSize } = useTextSize();
  const [consents, setConsents] = useState<ConsentMap | null>(null);
  // Logged-in user comes from the auth context (real API login, see context/auth-context.tsx).
  const { user, signOut } = useAuth();

  useFocusEffect(
    useCallback(() => {
      getConsents()
        .then(setConsents)
        .catch((e) => console.warn('Could not load consents', e));
    }, []),
  );

  const onToggle = async (key: ConsentKey, value: boolean) => {
    setConsents((c) => (c ? { ...c, [key]: value } : c));
    try {
      await setConsent(key, value);
    } catch (e) {
      console.warn('Could not save consent', e);
      setConsents((c) => (c ? { ...c, [key]: !value } : c));
      Alert.alert('Your choice was not saved', 'Please try again.');
    }
  };

  const onExport = async () => {
    try {
      await Share.share({ title: 'MS Companion data', message: await exportAllData() });
    } catch (e) {
      console.warn('Could not export data', e);
      Alert.alert('Your data was not exported', 'Please try again.');
    }
  };

  const onLogout = () => {
    Alert.alert('Log out?', 'Your health data stays on this phone. Log in again to see it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Protected routes in app/_layout.tsx then send the user to the login screen.
            await signOut();
          } catch (e) {
            console.warn('Could not log out', e);
            Alert.alert('You were not logged out', 'Please try again.');
          }
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert(
      'Delete all your data?',
      'Your profile, health data, choices and settings will be removed from this phone, and you will be logged out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              setSize('normal', { persist: false });
              // Onboarding is no longer complete, so app/index.tsx sends the user back to Welcome.
              await signOut();
            } catch (e) {
              console.warn('Could not delete data', e);
              Alert.alert('Your data was not deleted', 'Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen inTabs title="Settings">
      {user ? (
        <Section header="Account" iconInset>
          <Row
            icon="user"
            strong
            label={`${user.firstName} ${user.lastName}`.trim() || 'Logged in'}
            description={user.email}
          />
          <Row
            icon="log-out"
            label="Log out"
            onPress={onLogout}
            accessibilityHint="Asks you to confirm"
          />
        </Section>
      ) : null}

      <Section header="Text size" variant="plain">
        <SegmentedControl options={TEXT_SIZES} selected={size} onSelect={(s) => setSize(s)} />
      </Section>

      <Section
        header="What the app may use"
        iconInset
        footer="Symptom check-ins stay on while you use the app. To stop them, delete your data.">
        {consents
          ? OPTIONAL_CONSENTS.map((item) => (
              <SwitchRow
                key={item.key}
                icon={item.icon}
                label={item.label}
                description={item.description}
                value={consents[item.key]}
                onChange={(value) => onToggle(item.key, value)}
              />
            ))
          : null}
      </Section>

      <Section header="Your data" iconInset>
        <Row icon="download" label="Export my data" chevron onPress={onExport} />
        <Row icon="trash-2" label="Delete all my data" destructive onPress={onDelete} />
      </Section>
    </Screen>
  );
}
