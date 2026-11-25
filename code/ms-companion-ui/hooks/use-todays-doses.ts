import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { DoseLog, DoseStatus, DoseTime, Medication } from '@/types/health';
import { todayKey } from '@/utils/date';
import { clearDoseLog, getConsents, getDoseLogs, listMedications, logDose } from '@/utils/storage';

export interface TodaysDose {
  medication: Medication;
  time: DoseTime;
  status: DoseStatus | null;
}

export function useTodaysDoses() {
  const [allowed, setAllowed] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);

  const reload = useCallback(async () => {
    try {
      const consents = await getConsents();
      setAllowed(consents.medication);
      if (!consents.medication) {
        setMedications([]);
        setLogs([]);
        return;
      }
      const [meds, todaysLogs] = await Promise.all([listMedications(), getDoseLogs(todayKey())]);
      setMedications(meds);
      setLogs(todaysLogs);
    } catch (e) {
      console.warn("Could not load today's doses", e);
    }
  }, []);

  const doses: TodaysDose[] = medications
    .flatMap((medication) =>
      medication.times.map((time) => ({
        medication,
        time,
        status:
          logs.find((l) => l.medicationId === medication.id && l.time === time)?.status ?? null,
      })),
    )
    .sort(
      (a, b) => a.time.localeCompare(b.time) || a.medication.name.localeCompare(b.medication.name),
    );

  const log = async (dose: TodaysDose, status: DoseStatus) => {
    const today = todayKey();
    try {
      await logDose({
        medicationId: dose.medication.id,
        date: today,
        time: dose.time,
        status,
        loggedAt: new Date().toISOString(),
      });
      setLogs(await getDoseLogs(today));
    } catch (e) {
      console.warn('Could not log dose', e);
      Alert.alert('The dose was not saved', 'Please try again.');
    }
  };

  const undo = async (dose: TodaysDose) => {
    const today = todayKey();
    try {
      await clearDoseLog(dose.medication.id, today, dose.time);
      setLogs(await getDoseLogs(today));
    } catch (e) {
      console.warn('Could not undo dose', e);
      Alert.alert('The dose was not changed', 'Please try again.');
    }
  };

  return { allowed, doses, reload, log, undo };
}
