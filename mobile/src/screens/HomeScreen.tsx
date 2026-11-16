import React, { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { HeroCard } from '../components/HeroCard';
import { SafetyCard } from '../components/Notice';
import { RoundButton } from '../components/RoundButton';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { WeekDay, WeekStrip } from '../components/WeekStrip';
import { TabProps } from '../navigation/types';
import { getCheckIn, getDoseLogs, getProfile, listMedications } from '../services/storage';
import { colors } from '../theme/theme';
import { CheckIn, EMPTY_PROFILE, Profile } from '../types';
import { formatLongDate, formatTime, todayKey, weekKeys } from '../utils/date';
import { toDialNumber } from '../utils/validation';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// The check-in button uses a non-breaking hyphen so "check-in" never splits over two lines.
// Today tab: the daily check-in first, this week's progress, the health log, and the MS team one tap away.
export function HomeScreen({ navigation }: TabProps<'Today'>) {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [todaysCheckIn, setTodaysCheckIn] = useState<CheckIn | null>(null);
  const [week, setWeek] = useState<WeekDay[]>([]);
  const [doseSummary, setDoseSummary] = useState<string | undefined>(undefined);

  // Reload whenever the screen is shown, so changes made elsewhere appear straight away.
  useFocusEffect(
    useCallback(() => {
      const today = todayKey();
      getProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not load profile', e));
      const keys = weekKeys();
      Promise.all(keys.map((k) => getCheckIn(k)))
        .then((checkIns) => {
          setTodaysCheckIn(checkIns[keys.indexOf(today)] ?? null);
          setWeek(
            keys.map((date, i) => ({
              date,
              dayOfMonth: Number(date.slice(8)),
              letter: LETTERS[i],
              name: NAMES[i],
              isToday: date === today,
              isFuture: date > today,
              checkedIn: !!checkIns[i],
            }))
          );
        })
        .catch((e) => console.warn('Could not load check-ins', e));
      Promise.all([listMedications(), getDoseLogs(today)])
        .then(([meds, logs]) => {
          const total = meds.reduce((sum, m) => sum + m.times.length, 0);
          const taken = logs.filter((l) => l.status === 'taken' && meds.some((m) => m.id === l.medicationId)).length;
          setDoseSummary(total > 0 ? `${taken} of ${total} taken` : undefined);
        })
        .catch((e) => console.warn('Could not load medication', e));
    }, [])
  );

  const teamName = profile.teamName.trim() || 'your MS team';
  const hasPhone = profile.teamPhone.trim() !== '';

  const callTeam = () => {
    Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
      Alert.alert('The call did not start', `Dial ${profile.teamPhone} from your phone app.`)
    );
  };

  return (
    <Screen
      inTabs
      overline={formatLongDate()}
      title="Today"
      titleAccessory={
        <RoundButton
          icon="bell"
          label="Reminders"
          hint="Opens Settings, where you choose reminders"
          onPress={() => navigation.navigate('Settings')}
        />
      }
    >
      {todaysCheckIn ? (
        <HeroCard
          overline="Daily check-in"
          title="Done for today"
          subtitle={`Saved at ${formatTime(todaysCheckIn.savedAt)}. Thank you.`}
          action={<Button variant="light" label="Change today's answers" onPress={() => navigation.navigate('CheckIn')} />}
        />
      ) : (
        <HeroCard
          overline="Daily check-in"
          title="How are you feeling today?"
          subtitle="Six quick questions · about a minute"
          action={<Button variant="light" label="Start today's check‑in" onPress={() => navigation.navigate('CheckIn')} />}
        />
      )}

      {week.length ? (
        <Section header="This week" variant="plain">
          <WeekStrip days={week} />
        </Section>
      ) : null}

      <Section header="Your MS team">
        {hasPhone ? (
          <Row
            icon="phone"
            strong
            label={profile.teamName.trim() || 'MS team'}
            description={profile.teamPhone}
            onPress={callTeam}
            accessibilityLabel={`Call ${teamName}, ${profile.teamPhone}`}
            accessibilityHint="Opens your phone app"
            accessory={
              <AppText variant="label" color={colors.accent} style={{ fontWeight: '700' }}>
                Call
              </AppText>
            }
          />
        ) : (
          <Row
            icon="phone"
            strong
            label="Add phone number"
            description="Call your MS team with one tap."
            chevron
            onPress={() => navigation.navigate('ProfileTab')}
          />
        )}
      </Section>

      <SafetyCard>In an emergency, call 112.</SafetyCard>
    </Screen>
  );
}
