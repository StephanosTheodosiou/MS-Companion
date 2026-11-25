import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Section } from '@/components/layout/section';
import type { ScrollViewRef } from '@/components/layout/screen';
import { TextField } from '@/components/ui/app-text-field';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { MS_TYPES } from '@/constants/profile';
import { EMPTY_PROFILE, Profile } from '@/types/health';
import { pushProfile } from '@/utils/patientApi';
import { getProfile, saveProfile } from '@/utils/storage';
import { validatePhone } from '@/utils/validation';

/** Shared state and saving logic for both versions of the profile screen. */
export function useProfileForm() {
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
