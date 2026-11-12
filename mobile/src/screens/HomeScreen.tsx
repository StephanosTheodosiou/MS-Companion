import React, { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { RootStackParamList } from '../navigation/types';
import { getCheckIn, getProfile } from '../services/storage';
import { colors } from '../theme/theme';
import { CheckIn, EMPTY_PROFILE, Profile } from '../types';
import { formatLongDate, formatTime, todayKey } from '../utils/date';
import { toDialNumber } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Home: today's check-in is the main action. The MS team is always one tap away.
export function HomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [todaysCheckIn, setTodaysCheckIn] = useState<CheckIn | null>(null);

  // Reload whenever the screen is shown, so changes made elsewhere appear straight away.
  useFocusEffect(
    useCallback(() => {
      getProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not load profile', e));
      getCheckIn(todayKey())
        .then(setTodaysCheckIn)
        .catch((e) => console.warn('Could not load check-in', e));
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
    <Screen noHeader title="Today" subtitle={formatLongDate()}>
      {todaysCheckIn ? (
        <Section header="Daily check-in">
          <Row label="Done for today" value={`Saved ${formatTime(todaysCheckIn.savedAt)}`} />
          <Row label="Change today's answers" chevron onPress={() => navigation.navigate('CheckIn')} />
        </Section>
      ) : (
        <Section header="Daily check-in" variant="plain">
          <AppText>Six quick questions about how you feel. It takes about a minute.</AppText>
          <Button label="Start today's check-in" onPress={() => navigation.navigate('CheckIn')} />
        </Section>
      )}

      {hasPhone ? (
        <Section header="Your MS team">
          <Row
            label={teamName}
            description={profile.teamPhone}
            onPress={callTeam}
            accessory={
              <AppText variant="label" color={colors.accent}>
                Call
              </AppText>
            }
          />
        </Section>
      ) : (
        <Section header="Your MS team" footer="Add their number to call them with one tap.">
          <Row label="Add phone number" chevron onPress={() => navigation.navigate('Profile')} />
        </Section>
      )}

      <Section>
        <Row label="Profile" chevron onPress={() => navigation.navigate('Profile')} />
        <Row label="Settings" chevron onPress={() => navigation.navigate('Settings')} />
      </Section>
    </Screen>
  );
}
