import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ChoiceCards } from '../components/ChoiceCards';
import { Screen, ScrollViewRef } from '../components/Screen';
import { Row } from '../components/Row';
import { Section } from '../components/Section';
import { StepHeader } from '../components/StepHeader';
import { TextField } from '../components/TextField';
import { StackProps, TabProps } from '../navigation/types';
import { pushProfile } from '../services/api';
import { completeOnboarding, getProfile, saveProfile } from '../services/storage';
import { colors } from '../theme/theme';
import { EMPTY_PROFILE, MsType, Profile } from '../types';
import { validatePhone } from '../utils/validation';

export const MS_TYPES: { value: MsType; label: string }[] = [
  { value: 'RRMS', label: 'Relapsing-remitting' },
  { value: 'SPMS', label: 'Secondary progressive' },
  { value: 'PPMS', label: 'Primary progressive' },
  { value: 'CIS', label: 'Clinically isolated syndrome (CIS)' },
  { value: 'UNSURE', label: "I'm not sure" },
];

/** Shared state and saving logic for both versions of the profile screen. */
function useProfileForm() {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollViewRef>(null);

  const load = useCallback(() => {
    getProfile()
      .then(setProfile)
      .catch((e) => console.warn('Could not load profile', e));
  }, []);

  const update = (changes: Partial<Profile>) => setProfile((p) => ({ ...p, ...changes }));

  /** Returns true when saved. */
  const save = async (): Promise<boolean> => {
    const error = validatePhone(profile.teamPhone);
    setPhoneError(error);
    if (error) {
      scrollRef.current?.scrollToEnd({ animated: true }); // the phone field is last
      return false;
    }
    setSaving(true);
    try {
      await saveProfile(profile);
      pushProfile(profile).catch(() => {}); // backend sync comes later
      return true;
    } catch (e) {
      console.warn('Could not save profile', e);
      Alert.alert('Your profile was not saved', 'Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const fields = (
    <>
      <ChoiceCards
        header="Type of MS"
        options={MS_TYPES}
        selected={profile.msType}
        onSelect={(msType) => update({ msType })}
      />
      <Section variant="plain">
        <TextField
          label="MS team"
          icon="users"
          placeholder="Clinic or nurse you contact"
          value={profile.teamName}
          onChangeText={(teamName) => update({ teamName })}
          autoCapitalize="words"
        />
        <TextField
          label="MS team phone number"
          icon="phone"
          placeholder="Phone number"
          hint="Used for the call button on the Today screen."
          value={profile.teamPhone}
          onChangeText={(teamPhone) => {
            update({ teamPhone });
            if (phoneError) setPhoneError(null);
          }}
          keyboardType="phone-pad"
          error={phoneError}
        />
      </Section>
    </>
  );

  return { load, save, saving, scrollRef, fields };
}

// E1, step 3 of 3: first-time setup. Everything is optional.
export function ProfileSetupScreen({ navigation }: StackProps<'Profile'>) {
  const form = useProfileForm();
  useEffect(() => {
    form.load();
  }, [form.load]);

  const finish = async () => {
    try {
      await completeOnboarding();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      console.warn('Could not finish setup', e);
      Alert.alert('Setup was not finished', 'Please try again.');
    }
  };

  return (
    <Screen
      scrollRef={form.scrollRef}
      topBar={<StepHeader step={3} total={3} onBack={() => navigation.goBack()} />}
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

// E1: the Profile tab, for changing the profile later.
// Medicines have their own screen since E3, so the profile links to it instead of a text field.
export function ProfileTabScreen({ navigation }: TabProps<'ProfileTab'>) {
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
    </Screen>
  );
}
