import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TopBar } from '../components/TopBar';
import { StackProps } from '../navigation/types';
import { listAppointments } from '../services/storage';
import { Appointment } from '../types';
import { formatShortDate, todayKey } from '../utils/date';

export function appointmentTitle(a: Appointment): string {
  return `${formatShortDate(a.date)} · ${a.time}`;
}

export function appointmentDetails(a: Appointment): string | undefined {
  return [a.withWhom, a.place].filter(Boolean).join(' · ') || undefined;
}

// E7: upcoming and past appointments.
export function AppointmentsScreen({ navigation }: StackProps<'Appointments'>) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useFocusEffect(
    useCallback(() => {
      listAppointments()
        .then(setAppointments)
        .catch((e) => console.warn('Could not load appointments', e));
    }, [])
  );

  const today = todayKey();
  const upcoming = appointments.filter((a) => a.date >= today);
  const past = appointments.filter((a) => a.date < today).reverse().slice(0, 5);
  const open = (a: Appointment) => navigation.navigate('AppointmentEdit', { id: a.id });

  return (
    <Screen
      topBar={<TopBar onBack={() => navigation.goBack()} />}
      title="Appointments"
      subtitle="Appointments your MS clinic has booked for you."
      footer={<Button label="Add an appointment" onPress={() => navigation.navigate('AppointmentEdit')} />}
    >
      <Section header="Upcoming" iconInset footer={upcoming.length === 0 ? 'No upcoming appointments.' : undefined}>
        {upcoming.map((a) => (
          <Row key={a.id} icon="calendar" strong label={appointmentTitle(a)} description={appointmentDetails(a)} chevron onPress={() => open(a)} />
        ))}
      </Section>

      {past.length > 0 ? (
        <Section header="Past" iconInset footer="Your visit summary covers everything since your last visit.">
          {past.map((a) => (
            <Row key={a.id} icon="check-circle" label={appointmentTitle(a)} description={appointmentDetails(a)} chevron onPress={() => open(a)} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
