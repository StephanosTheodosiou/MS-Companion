import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { OptionGroup } from '../components/OptionGroup';
import { Screen, ScrollViewRef } from '../components/Screen';
import { Section } from '../components/Section';
import { TextField } from '../components/TextField';
import { RootStackParamList } from '../navigation/types';
import { pushProfile } from '../services/api';
import { completeOnboarding, getProfile, saveProfile } from '../services/storage';
import { EMPTY_PROFILE, MsType, Profile } from '../types';
import { validatePhone } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const MS_TYPES: { value: MsType; label: string }[] = [
  { value: 'RRMS', label: 'Relapsing-remitting' },
  { value: 'SPMS', label: 'Secondary progressive' },
  { value: 'PPMS', label: 'Primary progressive' },
  { value: 'UNSURE', label: "I'm not sure" },
];

// E1: MS type, medication and MS team contact.
// Used during first-time setup (onboarding = true) and later to edit the profile.
export function ProfileScreen({ navigation, route }: Props) {
  const onboarding = route.params?.onboarding ?? false;
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollViewRef>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((e) => console.warn('Could not load profile', e));
  }, []);

  const update = (changes: Partial<Profile>) => setProfile((p) => ({ ...p, ...changes }));
  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  const onSave = async () => {
    const error = validatePhone(profile.teamPhone);
    setPhoneError(error);
    if (error) {
      scrollRef.current?.scrollToEnd({ animated: true }); // the phone field is last
      return;
    }

    setSaving(true);
    try {
      await saveProfile(profile);
      pushProfile(profile).catch(() => {}); // backend sync comes later
      if (onboarding) {
        await completeOnboarding();
        goHome();
      } else {
        navigation.goBack();
      }
    } catch (e) {
      console.warn('Could not save profile', e);
      Alert.alert('Your profile was not saved', 'Check your phone and try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSkip = async () => {
    try {
      await completeOnboarding();
      goHome();
    } catch (e) {
      console.warn('Could not finish setup', e);
      Alert.alert('Setup was not finished', 'Check your phone and try again.');
    }
  };

  return (
    <Screen
      scrollRef={scrollRef}
      title={onboarding ? 'About you' : 'Your profile'}
      subtitle={
        onboarding
          ? 'This prepares your visit summary. Everything here is optional and you can add it later.'
          : undefined
      }
      footer={
        <>
          <Button label={onboarding ? 'Finish setup' : 'Save'} onPress={onSave} disabled={saving} />
          {onboarding ? <Button label="Skip for now" variant="plain" onPress={onSkip} /> : null}
        </>
      }
    >
      <OptionGroup
        header="Type of MS"
        options={MS_TYPES}
        selected={profile.msType}
        onSelect={(msType) => update({ msType })}
      />

      <Section variant="plain">
        <TextField
          label="Medication"
          hint="One per line, with the dose."
          value={profile.medication}
          onChangeText={(medication) => update({ medication })}
          multiline
        />
        <TextField
          label="MS team"
          hint="The clinic or nurse you contact about your MS."
          value={profile.teamName}
          onChangeText={(teamName) => update({ teamName })}
          autoCapitalize="words"
        />
        <TextField
          label="MS team phone number"
          hint="Used for the call button on the home screen."
          value={profile.teamPhone}
          onChangeText={(teamPhone) => {
            update({ teamPhone });
            if (phoneError) setPhoneError(null);
          }}
          keyboardType="phone-pad"
          error={phoneError}
        />
      </Section>
    </Screen>
  );
}
