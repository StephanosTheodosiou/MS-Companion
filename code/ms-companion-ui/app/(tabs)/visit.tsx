import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { HeroCard } from '@/components/hero-card';
import { Note } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { Appointment } from '@/types/health';
import { appointmentDetails, appointmentTitle, upcomingAppointments } from '@/utils/appointment';
import { todayKey } from '@/utils/date';
import { listAppointments, listQuestions, listSymptomEntries } from '@/utils/storage';

function whenLabel(date: string, today: string): string {
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function VisitScreen() {
  const router = useRouter();
  const [nextVisit, setNextVisit] = useState<Appointment | null>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [openQuestions, setOpenQuestions] = useState(0);
  const [symptomCount, setSymptomCount] = useState(0);
  const today = todayKey();

  useFocusEffect(
    useCallback(() => {
      listAppointments()
        .then((all) => {
          const future = upcomingAppointments(all); // F16: date and time, shared rule
          setNextVisit(future[0] ?? null);
          setUpcoming(future.length);
        })
        .catch((e) => console.warn('Could not load appointments', e));
      listQuestions()
        .then((qs) => setOpenQuestions(qs.filter((q) => !q.asked).length))
        .catch((e) => console.warn('Could not load questions', e));
      listSymptomEntries()
        .then((entries) => setSymptomCount(entries.length))
        .catch((e) => console.warn('Could not load symptom log', e));
    }, []),
  );

  return (
    <Screen inTabs title="Visit" subtitle="Everything for your next appointment with your MS team.">
      {nextVisit ? (
        <HeroCard
          overline={`Next visit · ${whenLabel(nextVisit.date, today)}`}
          title={appointmentTitle(nextVisit)}
          subtitle={appointmentDetails(nextVisit) ?? 'Add who and where in the appointment.'}
        />
      ) : (
        <HeroCard
          overline="Next visit"
          title="No visit planned yet"
          subtitle="Add your next appointment to get a summary ready for your doctor."
          action={
            <Button
              variant="light"
              label="Add an appointment"
              onPress={() => router.push('/appointment-edit')}
            />
          }
        />
      )}

      <Section header="For your doctor" iconInset>
        <Row
          icon="file-text"
          strong
          label="Visit summary"
          description="One page since your last visit. Share it as a PDF."
          chevron
          onPress={() => router.push('/visit-summary')}
        />
        <Row
          icon="help-circle"
          label="Questions for my doctor"
          value={openQuestions > 0 ? `${openQuestions} to ask` : undefined}
          chevron
          onPress={() => router.push('/questions')}
        />
        <Row
          icon="list"
          label="Symptom log"
          value={symptomCount > 0 ? `${symptomCount} logged` : undefined}
          chevron
          onPress={() => router.push('/symptom-log')}
        />
      </Section>

      <Section header="Appointments" iconInset>
        <Row
          icon="calendar"
          label="All appointments"
          value={upcoming > 0 ? `${upcoming} upcoming` : undefined}
          chevron
          onPress={() => router.push('/appointments')}
        />
      </Section>

      <Note icon="info">
        The summary shows observations from your check-ins. It does not diagnose a relapse.
      </Note>
    </Screen>
  );
}
