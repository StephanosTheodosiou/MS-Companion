import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Section } from '@/components/layout/section';
import type { ScrollViewRef } from '@/components/layout/screen';
import { TextField } from '@/components/ui/app-text-field';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { PickerRow } from '@/components/ui/picker-row';
import { Row } from '@/components/ui/row';
import { MS_TYPES } from '@/constants/profile';
import { EMPTY_PROFILE, Profile } from '@/types/health';
import { ApiError } from '@/utils/apiClient';
import { todayKey } from '@/utils/date';
import { fetchProfile, pushProfile } from '@/utils/patientApi';
import { getProfile, saveProfile } from '@/utils/storage';
import { validatePhone } from '@/utils/validation';

/** "1985-03-12" -> local Date at midday (avoids time-zone edge cases). */
function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** "12 March 1985" */
export function formatBirthDate(key: string): string {
  return keyToDate(key).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Same rule as the API (UpdatePatientRequest): in the past and not before 1900. */
function validateBirthDate(key: string | null): string | null {
  if (!key) return null;
  if (key > todayKey() || key < '1900-01-01') return 'Choose a date of birth in the past.';
  return null;
}

const BIRTH_PICKER_START = new Date(1980, 0, 1, 12);
const EARLIEST_BIRTH = new Date(1900, 0, 1, 12);

/** Shared state and saving logic for both versions of the profile screen. */
export function useProfileForm() {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollViewRef>(null);
  /** Set once the user changes something, so a late answer from the server does not overwrite it. */
  const edited = useRef(false);

  /** Shows what is saved on the phone straight away, then the server's version when it arrives. */
  const load = useCallback(() => {
    edited.current = false;
    getProfile()
      .then(async (local) => {
        setProfile(local);
        try {
          const server = await fetchProfile();
          if (edited.current) return;
          const merged = { ...local, ...server };
          setProfile(merged);
          await saveProfile(merged);
        } catch (e) {
          // Offline or not reachable: the phone's copy is shown, which is fine.
          console.warn('Could not load profile from the server', e);
        }
      })
      .catch((e) => console.warn('Could not load profile', e));
  }, []);

  const update = (changes: Partial<Profile>) => {
    edited.current = true;
    setProfile((p) => ({ ...p, ...changes }));
  };

  /** Returns true when saved (on the phone, and on the server when it can be reached). */
  const save = async (): Promise<boolean> => {
    const phone = validatePhone(profile.teamPhone);
    const birth = validateBirthDate(profile.dateOfBirth);
    setPhoneError(phone);
    setBirthError(birth);
    if (phone || birth) {
      scrollRef.current?.scrollToEnd({ animated: true }); // both fields are at the end
      return false;
    }
    setSaving(true);
    try {
      await saveProfile(profile);
    } catch (e) {
      console.warn('Could not save profile', e);
      Alert.alert('Your profile was not saved', 'Please try again.');
      setSaving(false);
      return false;
    }
    try {
      await pushProfile(profile);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        // The server checks the same fields; show its message under the matching one.
        const errors = e.fieldErrors;
        setPhoneError(errors.msTeamPhone ?? null);
        setBirthError(errors.dateOfBirth ?? null);
        if (!errors.msTeamPhone && !errors.dateOfBirth) {
          Alert.alert('Your profile was not saved', e.message);
        }
        return false;
      }
      console.warn('Could not save profile on the server', e);
      Alert.alert(
        'Saved on this phone only',
        'MS Companion could not be reached. Save again when you are online to update your account.',
      );
      return true;
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
          hint="Used for the call button on the Home screen."
          value={profile.teamPhone}
          onChangeText={(teamPhone) => {
            update({ teamPhone });
            if (phoneError) setPhoneError(null);
          }}
          keyboardType="phone-pad"
          error={phoneError}
        />
      </Section>
      <Section
        header="Date of birth (optional)"
        footer="Printed on your visit summary next to your name."
        iconInset>
        <PickerRow
          label="Date of birth"
          mode="date"
          value={profile.dateOfBirth ? keyToDate(profile.dateOfBirth) : null}
          display={profile.dateOfBirth ? formatBirthDate(profile.dateOfBirth) : null}
          defaultDate={BIRTH_PICKER_START}
          minimumDate={EARLIEST_BIRTH}
          maximumDate={new Date()}
          onChange={(d) => {
            update({ dateOfBirth: todayKey(d) });
            setBirthError(null);
          }}
          error={birthError}
        />
        {profile.dateOfBirth ? (
          <Row
            icon="x"
            label="Remove date of birth"
            onPress={() => {
              update({ dateOfBirth: null });
              setBirthError(null);
            }}
          />
        ) : null}
      </Section>
    </>
  );

  return { load, save, saving, scrollRef, fields };
}
