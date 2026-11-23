import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { HeroCard } from '@/components/hero-card';
import { Note } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { Appointment } from '@/types/health';
import { appointmentDetails, appointmentTitle } from '@/utils/appointment';
import { bloodTestSummary } from '@/utils/bloodTest';
import { todayKey } from '@/utils/date';
import { listAppointments, listBloodTests, listQuestions } from '@/utils/storage';

/** "today", "tomorrow" or "in 5 days" for a YYYY-MM-DD date that is today or later. */
function whenLabel(date: string, today: string): string {
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// E7 Visit tab: everything for the next clinic visit in one place. It reuses the Sprint 5 screens
// (appointments, questions for the doctor, blood tests, the one-page visit summary with PDF export).
export default function VisitScreen() {
  const router = useRouter();
  const [nextVisit, setNextVisit] = useState<Appointment | null>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [openQuestions, setOpenQuestions] = useState(0);
  const [bloodTestNote, setBloodTestNote] = useState<string | undefined>(undefined);
  const today = todayKey();

  // Reload whenever the tab is shown, so changes made on other screens appear straight away.
  useFocusEffect(
    useCallback(() => {
      const now = todayKey();
      listAppointments()
        .then((all) => {
          const future = all.filter((a) => a.date >= now);
          setNextVisit(future[0] ?? null);
          setUpcoming(future.length);
        })
        .catch((e) => console.warn('Could not load appointments', e));
      listQuestions()
        .then((qs) => setOpenQuestions(qs.filter((q) => !q.asked).length))
        .catch((e) => console.warn('Could not load questions', e));
      listBloodTests()
        .then((tests) => setBloodTestNote(bloodTestSummary(tests, now)))
        .catch((e) => console.warn('Could not load blood tests', e));
    }, [])
  );

  return (
    <Screen inTabs title="Visit" subtitle="Get ready for your next appointment with your MS team.">
      {nextVisit ? (
        <HeroCard
          overline={`Next visit · ${whenLabel(nextVisit.date, today)}`}
          title={appointmentTitle(nextVisit)}
          subtitle={appointmentDetails(nextVisit) ?? 'Add who and where in the appointment.'}
          action={
            <Button
              variant="light"
              label="Open visit summary"
              onPress={() => router.push('/visit-summary')}
            />
          }
        />
      ) : (
        <HeroCard
          overline="Next visit"
          title="No visit planned yet"
          subtitle="Add your next appointment to get a reminder and a summary for your doctor."
          action={
            <Button variant="light" label="Add an appointment" onPress={() => router.push('/appointment-edit')} />
          }
        />
      )}

      <Section header="Before the visit" iconInset>
        <Row
          icon="help-circle"
          label="Questions for my doctor"
          value={openQuestions > 0 ? `${openQuestions} to ask` : undefined}
          chevron
          onPress={() => router.push('/questions')}
        />
        <Row
          icon="file-text"
          label="Visit summary"
          description="One page since your last visit. Share it as a PDF."
          chevron
          onPress={() => router.push('/visit-summary')}
        />
        <Row icon="droplet" label="Blood tests" value={bloodTestNote} chevron onPress={() => router.push('/blood-tests')} />
      </Section>

      <Section header="Appointments" iconInset>
        <Row
          icon="calendar"
          label="All appointments"
          value={upcoming > 0 ? `${upcoming} upcoming` : undefined}
          chevron
          onPress={() => router.push('/appointments')}
        />
        <Row icon="plus" label="Add an appointment" chevron onPress={() => router.push('/appointment-edit')} />
      </Section>

      <Note icon="info">The summary shows observations from your check-ins. It does not diagnose a relapse.</Note>
    </Screen>
  );
}
