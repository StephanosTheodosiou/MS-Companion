import React, { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { RootStackParamList } from '../navigation/types';
import { getProfile } from '../services/storage';
import { EMPTY_PROFILE, Profile } from '../types';
import { toDialNumber } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Home. The daily check-in (E2) replaces the placeholder in the next sprint.
export function HomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });

  // Reload whenever the screen is shown, so profile edits appear straight away.
  useFocusEffect(
    useCallback(() => {
      getProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not load profile', e));
    }, [])
  );

  const teamName = profile.teamName.trim() || 'MS team';
  const hasPhone = profile.teamPhone.trim() !== '';

  const callTeam = () => {
    Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
      Alert.alert('The call did not start', `Dial ${profile.teamPhone} from your phone app.`)
    );
  };

  return (
    <Screen noHeader title="Today" subtitle={todayLabel()}>
      <Section header="Daily check-in">
        <Row label="How do you feel today?" description="The daily check-in is coming soon." />
      </Section>

      {hasPhone ? (
        <Section header="Your MS team">
          <Row label={teamName} value={profile.teamPhone} />
        </Section>
      ) : (
        <Section header="Your MS team" footer="Add their number to call them with one tap.">
          <Row label="Add phone number" chevron onPress={() => navigation.navigate('Profile')} />
        </Section>
      )}
      {hasPhone ? (
        <Button label={`Call ${teamName}`} onPress={callTeam} accessibilityHint="Opens your phone app" />
      ) : null}

      <Section>
        <Row label="Profile" chevron onPress={() => navigation.navigate('Profile')} />
        <Row label="Settings" chevron onPress={() => navigation.navigate('Settings')} />
      </Section>
    </Screen>
  );
}
