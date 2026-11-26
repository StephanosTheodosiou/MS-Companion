import React, { useCallback, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Row, SwitchRow } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { OPTIONAL_CONSENTS } from '@/constants/consent';
import { MS_TYPES } from '@/constants/profile';
import { useAuth } from '@/context/auth-context';
import { useTextSize } from '@/context/text-size-context';
import { ConsentKey, ConsentMap, Profile, TextSize } from '@/types/health';
import { ApiError } from '@/utils/apiClient';
import { bloodTestSummary } from '@/utils/bloodTest';
import { fetchConsents, pushConsents } from '@/utils/patientApi';
import {
  deleteAllData,
  exportAllData,
  getConsents,
  getProfile,
  listBloodTests,
  saveAllConsents,
  setConsent,
} from '@/utils/storage';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Largest' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { size, setSize } = useTextSize();
  const [consents, setConsents] = useState<ConsentMap | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bloodTestNote, setBloodTestNote] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      // The phone's copy first, then the server's (the record of what the user agreed to).
      getConsents()
        .then(async (local) => {
          setConsents(local);
          try {
            const server = await fetchConsents();
            if (server.decided) {
              setConsents(server.consents);
              await saveAllConsents(server.consents);
            }
          } catch (e) {
            console.warn('Could not load consents from the server', e);
          }
        })
        .catch((e) => console.warn('Could not load consents', e));
      getProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not load profile', e));
      listBloodTests()
        .then((tests) => setBloodTestNote(bloodTestSummary(tests)))
        .catch((e) => console.warn('Could not load blood tests', e));
    }, []),
  );

  const onToggle = async (key: ConsentKey, value: boolean) => {
    setConsents((c) => (c ? { ...c, [key]: value } : c));
    try {
      // Recorded on the server first (GDPR: the record of the choice), then on the phone.
      await pushConsents({ [key]: value });
      await setConsent(key, value);
    } catch (e) {
      console.warn('Could not save consent', e);
      setConsents((c) => (c ? { ...c, [key]: !value } : c));
      const offline = e instanceof ApiError && e.isNetworkError;
      Alert.alert(
        'Your choice was not saved',
        offline
          ? "MS Companion couldn't be reached. Check your internet connection and try again."
          : 'Please try again.',
      );
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

  const msTypeLabel = MS_TYPES.find((t) => t.value === profile?.msType)?.label;
  const aboutMe = [msTypeLabel, profile?.teamName.trim()].filter(Boolean).join(' · ');

  return (
    <Screen inTabs title="Profile">
      {user ? (
        <Section header="Account" iconInset>
          <Row
            icon="user"
            strong
            label={`${user.firstName} ${user.lastName}`.trim() || 'Logged in'}
            description={user.email}
          />
        </Section>
      ) : null}

      <Section header="My health" iconInset>
        <Row
          icon="heart"
          label="About me"
          description={aboutMe || 'Type of MS and your MS team'}
          chevron
          onPress={() => router.push('/profile-edit')}
        />
        <Row
          icon="plus-square"
          label="My medicines"
          description="Medicines, doses and side effects"
          chevron
          onPress={() => router.push('/medications')}
        />
        <Row
          icon="droplet"
          label="Blood-test reminders"
          value={bloodTestNote}
          chevron
          onPress={() => router.push('/blood-tests')}
        />
      </Section>

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

      <Section iconInset>
        <Row
          icon="log-out"
          label="Log out"
          onPress={onLogout}
          accessibilityHint="Asks you to confirm"
        />
      </Section>
    </Screen>
  );
}
