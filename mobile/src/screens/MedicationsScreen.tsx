import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { DoseRow } from '../components/DoseRow';
import { Note } from '../components/Notice';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TopBar } from '../components/TopBar';
import { doseTimeLabel, sortTimes } from '../constants/medication';
import { StackProps } from '../navigation/types';
import { clearDoseLog, getConsents, getDoseLogs, listMedications, listSideEffects, logDose } from '../services/storage';
import { DoseLog, DoseStatus, DoseTime, Medication, SideEffect } from '../types';
import { formatShortDate, todayKey } from '../utils/date';

interface ScheduledDose {
  medication: Medication;
  time: DoseTime;
}

// E3: today's doses (taken / skipped), the medicine list and side effects.
export function MedicationsScreen({ navigation }: StackProps<'Medications'>) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const today = todayKey();

  const load = useCallback(async () => {
    try {
      const [consents, meds, todaysLogs, effects] = await Promise.all([
        getConsents(),
        listMedications(),
        getDoseLogs(today),
        listSideEffects(),
      ]);
      setAllowed(consents.medication);
      setMedications(meds);
      setLogs(todaysLogs);
      setSideEffects(effects);
    } catch (e) {
      console.warn('Could not load medication', e);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const topBar = <TopBar onBack={() => navigation.goBack()} />;

  // GDPR: medication data is only used if the person allowed it.
  if (allowed === false) {
    return (
      <Screen
        topBar={topBar}
        title="Medication"
        subtitle="You chose not to let the app store your medication."
        footer={
          <Button label="Open Settings" onPress={() => navigation.navigate('Home', { screen: 'Settings' })} />
        }
      >
        <Note icon="info">To track doses and get reminders, turn on Medication under "What the app may use".</Note>
      </Screen>
    );
  }

  const doses: ScheduledDose[] = medications
    .flatMap((medication) => medication.times.map((time) => ({ medication, time })))
    .sort((a, b) => a.time.localeCompare(b.time) || a.medication.name.localeCompare(b.medication.name));

  const statusOf = (dose: ScheduledDose) =>
    logs.find((l) => l.medicationId === dose.medication.id && l.time === dose.time)?.status ?? null;
  const takenCount = doses.filter((d) => statusOf(d) === 'taken').length;

  const onLog = async (dose: ScheduledDose, status: DoseStatus) => {
    try {
      await logDose({ medicationId: dose.medication.id, date: today, time: dose.time, status, loggedAt: new Date().toISOString() });
      setLogs(await getDoseLogs(today));
    } catch (e) {
      console.warn('Could not log dose', e);
      Alert.alert('The dose was not saved', 'Please try again.');
    }
  };

  const onUndo = async (dose: ScheduledDose) => {
    try {
      await clearDoseLog(dose.medication.id, today, dose.time);
      setLogs(await getDoseLogs(today));
    } catch (e) {
      console.warn('Could not undo dose', e);
    }
  };

  const medName = (id: string) => medications.find((m) => m.id === id)?.name ?? 'Removed medicine';

  return (
    <Screen topBar={topBar} title="Medication">
      {doses.length > 0 ? (
        <Section header="Today" iconInset footer={`${takenCount} of ${doses.length} doses taken today.`}>
          {doses.map((dose) => (
            <DoseRow
              key={`${dose.medication.id}-${dose.time}`}
              title={dose.medication.name}
              subtitle={[doseTimeLabel(dose.time), dose.medication.dose].filter(Boolean).join(' · ')}
              status={statusOf(dose)}
              onLog={(status) => onLog(dose, status)}
              onUndo={() => onUndo(dose)}
            />
          ))}
        </Section>
      ) : null}

      <Section
        header="My medicines"
        iconInset
        footer={medications.length === 0 ? 'Add the medicines you take for your MS.' : undefined}
      >
        {medications.map((m) => (
          <Row
            key={m.id}
            icon="plus-square"
            strong
            label={m.name}
            description={[m.dose, sortTimes(m.times).join(', ')].filter(Boolean).join(' · ')}
            chevron
            onPress={() => navigation.navigate('MedicationEdit', { id: m.id })}
          />
        ))}
        <Row icon="plus" label="Add a medicine" chevron onPress={() => navigation.navigate('MedicationEdit')} />
      </Section>

      {medications.length > 0 ? (
        <Section header="Side effects" iconInset footer="These are added to your visit summary.">
          {sideEffects.slice(0, 3).map((s) => (
            <Row
              key={s.id}
              icon="alert-circle"
              label={s.description}
              description={`${medName(s.medicationId)} · ${formatShortDate(todayKey(new Date(s.loggedAt)))}`}
            />
          ))}
          <Row icon="edit-3" label="Note a side effect" chevron onPress={() => navigation.navigate('SideEffect')} />
        </Section>
      ) : null}
    </Screen>
  );
}
