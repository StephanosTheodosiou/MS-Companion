import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TopBar } from '@/components/layout/top-bar';
import { listAppointments } from '@/utils/storage';
import { Appointment } from '@/types/health';
import {
  appointmentDetails,
  appointmentTitle,
  pastAppointments,
  upcomingAppointments,
} from '@/utils/appointment';

// E7: upcoming and past appointments.
export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useFocusEffect(
    useCallback(() => {
      listAppointments()
        .then(setAppointments)
        .catch((e) => console.warn('Could not load appointments', e));
    }, []),
  );

  // F16: date and time, with the same rule as Home, the Visit tab and the visit summary.
  const upcoming = upcomingAppointments(appointments);
  const past = pastAppointments(appointments).slice(0, 5);
  const open = (a: Appointment) =>
    router.push({ pathname: '/appointment-edit', params: { id: a.id } });

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="Appointments"
      subtitle="Appointments your MS clinic has booked for you."
      footer={
        <Button label="Add an appointment" onPress={() => router.push('/appointment-edit')} />
      }>
      <Section
        header="Upcoming"
        iconInset
        footer={upcoming.length === 0 ? 'No upcoming appointments.' : undefined}>
        {upcoming.map((a) => (
          <Row
            key={a.id}
            icon="calendar"
            strong
            label={appointmentTitle(a)}
            description={appointmentDetails(a)}
            chevron
            onPress={() => open(a)}
          />
        ))}
      </Section>

      {past.length > 0 ? (
        <Section
          header="Past"
          iconInset
          footer="Your visit summary covers everything since your last visit.">
          {past.map((a) => (
            <Row
              key={a.id}
              icon="check-circle"
              label={appointmentTitle(a)}
              description={appointmentDetails(a)}
              chevron
              onPress={() => open(a)}
            />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
