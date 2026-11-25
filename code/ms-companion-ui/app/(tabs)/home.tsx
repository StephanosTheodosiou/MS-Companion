import React, { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { DoseRow } from '@/components/dose-row';
import { HeroCard } from '@/components/hero-card';
import { SafetyCard } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { doseTimeLabel } from '@/constants/medication';
import { useAuth } from '@/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { useTodaysDoses } from '@/hooks/use-todays-doses';
import { Appointment, CheckIn, EMPTY_PROFILE, Profile } from '@/types/health';
import { appointmentDetails, appointmentTitle } from '@/utils/appointment';
import { bloodTestSummary } from '@/utils/bloodTest';
import { daysBetween, formatLongDate, formatTime, todayKey } from '@/utils/date';
import { getCheckIn, getProfile, listAppointments, listBloodTests } from '@/utils/storage';
import { toDialNumber } from '@/utils/validation';

const VISIT_SOON_DAYS = 7;

function visitWhen(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { allowed: medicationAllowed, doses, reload: reloadDoses, log, undo } = useTodaysDoses();
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [todaysCheckIn, setTodaysCheckIn] = useState<CheckIn | null>(null);
  const [soonVisit, setSoonVisit] = useState<Appointment | null>(null);
  const [bloodTestNote, setBloodTestNote] = useState<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      const today = todayKey();
      getProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not load profile', e));
      getCheckIn(today)
        .then(setTodaysCheckIn)
        .catch((e) => console.warn('Could not load check-in', e));
      reloadDoses();
      listAppointments()
        .then((all) => {
          const next = all.find((a) => a.date >= today) ?? null;
          setSoonVisit(next && daysBetween(today, next.date) <= VISIT_SOON_DAYS ? next : null);
        })
        .catch((e) => console.warn('Could not load appointments', e));
      listBloodTests()
        .then((tests) => setBloodTestNote(bloodTestSummary(tests, today)))
        .catch((e) => console.warn('Could not load blood tests', e));
    }, [reloadDoses]),
  );

  const takenCount = doses.filter((dose) => dose.status === 'taken').length;
  const teamName = profile.teamName.trim() || 'your MS team';
  const hasPhone = profile.teamPhone.trim() !== '';
  const visitDays = soonVisit ? daysBetween(todayKey(), soonVisit.date) : 0;

  const callTeam = () => {
    Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
      Alert.alert('The call did not start', `Dial ${profile.teamPhone} from your phone app.`),
    );
  };

  return (
    <Screen
      inTabs
      overline={formatLongDate()}
      title={user?.firstName ? `Hello, ${user.firstName}` : 'Home'}>
      {todaysCheckIn ? (
        <HeroCard
          overline="Daily check-in"
          title="Done for today"
          subtitle={`Saved at ${formatTime(todaysCheckIn.savedAt)}. Thank you.`}
          action={
            <Button
              variant="light"
              label="Change today's answers"
              onPress={() => router.push('/check-in')}
            />
          }
        />
      ) : (
        <HeroCard
          overline="Daily check-in"
          title="How are you feeling today?"
          subtitle="Six quick questions · about a minute"
          action={
            <Button
              variant="light"
              label="Start today's check‑in"
              onPress={() => router.push('/check-in')}
            />
          }
        />
      )}

      {medicationAllowed && doses.length > 0 ? (
        <Section
          header="Today's medicines"
          iconInset
          footer={`${takenCount} of ${doses.length} taken today.`}>
          {doses.map((dose) => (
            <DoseRow
              key={`${dose.medication.id}-${dose.time}`}
              title={dose.medication.name}
              subtitle={[doseTimeLabel(dose.time), dose.medication.dose]
                .filter(Boolean)
                .join(' · ')}
              status={dose.status}
              onLog={(status) => log(dose, status)}
              onUndo={() => undo(dose)}
            />
          ))}
        </Section>
      ) : null}

      {bloodTestNote || soonVisit ? (
        <Section header="Needs attention" iconInset>
          {bloodTestNote ? (
            <Row
              icon="droplet"
              label="Blood tests"
              value={bloodTestNote}
              chevron
              onPress={() => router.push('/blood-tests')}
            />
          ) : null}
          {soonVisit ? (
            <Row
              icon="calendar"
              strong
              label={`Visit ${visitWhen(visitDays).toLowerCase()}`}
              description={[appointmentTitle(soonVisit), appointmentDetails(soonVisit)]
                .filter(Boolean)
                .join(' · ')}
              chevron
              accessibilityHint="Opens the Visit tab"
              onPress={() => router.navigate('/visit')}
            />
          ) : null}
        </Section>
      ) : null}

      <Section header="Not feeling right?" iconInset>
        <Row
          icon="alert-triangle"
          strong
          label="New or worse symptom"
          description="Log it and see what to do next."
          chevron
          onPress={() => router.push('/symptom-entry')}
        />
        {hasPhone ? (
          <Row
            icon="phone"
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
            label="Add your MS team's number"
            description="Call them with one tap."
            chevron
            onPress={() => router.push('/profile-edit')}
          />
        )}
      </Section>

      <SafetyCard>In an emergency, call 112.</SafetyCard>
    </Screen>
  );
}
