import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { PickerRow } from '@/components/ui/picker-row';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { deleteAppointment, getAppointment, saveAppointment } from '@/utils/storage';
import { todayKey } from '@/utils/date';
import { newId } from '@/utils/id';

/** "2026-11-17" -> local Date at midday (avoids time-zone edge cases). */
function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function timeToDate(time: string): Date {
  const [h, min] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// E7: record an appointment the clinic has booked. Past visits can be added too,
// because the visit summary covers everything since the last visit.
export default function AppointmentEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [withWhom, setWithWhom] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    getAppointment(editingId)
      .then((a) => {
        if (!a) return;
        setDate(a.date);
        setTime(a.time);
        setWithWhom(a.withWhom);
        setPlace(a.place);
        setNotes(a.notes);
      })
      .catch((e) => console.warn('Could not load appointment', e));
  }, [editingId]);

  const onSave = async () => {
    setDateError(date ? null : 'Choose a date.');
    setTimeError(time ? null : 'Choose a time.');
    if (!date || !time) return;
    try {
      await saveAppointment({
        id: editingId ?? newId(),
        date,
        time,
        withWhom: withWhom.trim(),
        place: place.trim(),
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      console.warn('Could not save appointment', e);
      Alert.alert('The appointment was not saved', 'Please try again.');
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert('Remove this appointment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(editingId);
            router.back();
          } catch (e) {
            console.warn('Could not remove appointment', e);
          }
        },
      },
    ]);
  };

  const dateLabel = date
    ? keyToDate(date).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title={editingId ? 'Edit appointment' : 'Add an appointment'}
      subtitle="Add appointments your MS clinic has booked for you, or past visits."
      footer={<Button label="Save" onPress={onSave} />}>
      <Section header="When" iconInset>
        <PickerRow
          label="Date"
          mode="date"
          value={date ? keyToDate(date) : null}
          display={dateLabel}
          onChange={(d) => {
            setDate(todayKey(d));
            setDateError(null);
          }}
          error={dateError}
        />
        <PickerRow
          label="Time"
          mode="time"
          value={time ? timeToDate(time) : null}
          display={time}
          onChange={(d) => {
            setTime(dateToTime(d));
            setTimeError(null);
          }}
          error={timeError}
        />
      </Section>

      <Section variant="plain">
        <TextField
          label="With"
          icon="user"
          placeholder="For example: Dr Andreas, MS nurse"
          hint="Optional."
          value={withWhom}
          onChangeText={setWithWhom}
          autoCapitalize="words"
        />
        <TextField
          label="Where"
          icon="map-pin"
          placeholder="Hospital or clinic"
          hint="Optional."
          value={place}
          onChangeText={setPlace}
        />
        <TextField
          label="Notes"
          icon="edit-3"
          placeholder="For example: bring blood test results"
          hint="Optional."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Section>

      {editingId ? (
        <Section iconInset>
          <Row icon="trash-2" label="Remove this appointment" destructive onPress={onDelete} />
        </Section>
      ) : null}
    </Screen>
  );
}
