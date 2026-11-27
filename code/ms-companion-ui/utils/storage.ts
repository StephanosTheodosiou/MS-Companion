import {
  Appointment,
  BloodTest,
  CheckIn,
  ConsentKey,
  ConsentMap,
  DoctorQuestion,
  DoseLog,
  EMPTY_PROFILE,
  Medication,
  Profile,
  SideEffect,
  SymptomEntry,
  TextSize,
} from '@/types/health';
import {
  deleteUserDatabase,
  findRecord,
  getDeviceValue,
  getUserValue,
  isUserDatabaseOpen,
  listRecords,
  putRecord,
  removeDeviceValue,
  removeRecord,
  setDeviceValue,
  setUserValue,
} from '@/utils/localDatabase';
import { todayKey } from '@/utils/date';

const CONSENT_KEYS: ConsentKey[] = ['symptoms', 'medication', 'location', 'notifications'];

const consentValueKey = (key: ConsentKey) => `consent.${key}`;

const doseKey = (medicationId: string, date: string, time: string) =>
  `${medicationId}|${date}|${time}`;

// ---------- Entries saved before the N3 form changes ----------
// The phone may still hold entries in the older shape. They are upgraded when read, so screens
// only ever see the current types. Nothing is guessed: unknown answers stay empty (null).

type Legacy<T> = Partial<T> & Record<string, unknown>;

/** Old blood tests repeated in months (1, 3, 6, 12); now it is weeks (4, 13, 26, 52). */
const MONTHS_TO_WEEKS: Record<string, BloodTest['repeat']> = {
  '1': '4',
  '3': '13',
  '6': '26',
  '12': '52',
};

function upgradeSideEffect(e: Legacy<SideEffect>): SideEffect {
  const loggedAt = e.loggedAt ?? new Date().toISOString();
  return {
    id: e.id ?? '',
    medicationId: e.medicationId ?? null,
    description: e.description ?? '',
    severity: e.severity ?? null,
    startedOn: e.startedOn ?? todayKey(new Date(loggedAt)),
    loggedAt,
  };
}

function upgradeSymptomEntry(e: Legacy<SymptomEntry>): SymptomEntry {
  // Old entries asked one combined question ("fever, infection or very hot?").
  // A "yes" there is kept as hadFever, which leads to the same guidance.
  const combined = e.feverOrHeat === true;
  return {
    ...(e as SymptomEntry),
    hadFever: e.hadFever ?? combined,
    heatExposure: e.heatExposure ?? false,
  };
}

function upgradeAppointment(a: Legacy<Appointment>): Appointment {
  return { ...(a as Appointment), type: a.type ?? 'Other', endTime: a.endTime ?? null };
}

function upgradeBloodTest(b: Legacy<BloodTest>): BloodTest {
  const repeat = String(b.repeat ?? 'none');
  return {
    ...(b as BloodTest),
    repeat: MONTHS_TO_WEEKS[repeat] ?? (repeat as BloodTest['repeat']),
  };
}

export async function getConsents(): Promise<ConsentMap> {
  const values = await Promise.all(
    CONSENT_KEYS.map((key) => getUserValue<boolean>(consentValueKey(key))),
  );
  return {
    symptoms: values[0] === true,
    medication: values[1] === true,
    location: values[2] === true,
    notifications: values[3] === true,
  };
}

export async function setConsent(key: ConsentKey, granted: boolean): Promise<void> {
  await setUserValue(consentValueKey(key), granted);
}

export async function saveAllConsents(next: ConsentMap): Promise<void> {
  for (const key of CONSENT_KEYS) {
    await setUserValue(consentValueKey(key), next[key]);
  }
}

export async function getProfile(): Promise<Profile> {
  return { ...EMPTY_PROFILE, ...(await getUserValue<Profile>('profile')) };
}

export async function saveProfile(next: Profile): Promise<void> {
  await setUserValue('profile', {
    msType: next.msType,
    medication: next.medication.trim(),
    teamName: next.teamName.trim(),
    teamPhone: next.teamPhone.trim(),
    dateOfBirth: next.dateOfBirth,
  });
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  if (isUserDatabaseOpen()) {
    return (await getUserValue<boolean>('onboardingCompleted')) === true;
  }
  return (await getDeviceValue<boolean>('deviceOnboarded')) === true;
}

export async function completeOnboarding(): Promise<void> {
  await setUserValue('onboardingCompleted', true);
  await setDeviceValue('deviceOnboarded', true);
}

export async function getTextSize(): Promise<TextSize> {
  return (await getDeviceValue<TextSize>('textSize')) ?? 'normal';
}

export async function setTextSize(size: TextSize): Promise<void> {
  await setDeviceValue('textSize', size);
}

export async function getCheckIn(date: string): Promise<CheckIn | null> {
  return findRecord<CheckIn>('checkIn', date);
}

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  await putRecord('checkIn', checkIn.date, checkIn);
}

export async function listMedications(): Promise<Medication[]> {
  return listRecords<Medication>('medication');
}

export async function getMedication(id: string): Promise<Medication | null> {
  return findRecord<Medication>('medication', id);
}

export async function saveMedication(medication: Medication): Promise<void> {
  await putRecord('medication', medication.id, medication, medication.id);
}

export async function deleteMedication(id: string): Promise<void> {
  await removeRecord('medication', id);
}

export async function getDoseLogs(date: string): Promise<DoseLog[]> {
  return (await listRecords<DoseLog>('doseLog')).filter((log) => log.date === date);
}

export async function logDose(log: DoseLog): Promise<void> {
  await putRecord('doseLog', doseKey(log.medicationId, log.date, log.time), log);
}

export async function clearDoseLog(
  medicationId: string,
  date: string,
  time: string,
): Promise<void> {
  await removeRecord('doseLog', doseKey(medicationId, date, time));
}

export async function listSideEffects(): Promise<SideEffect[]> {
  return (await listRecords<Legacy<SideEffect>>('sideEffect'))
    .map(upgradeSideEffect)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function addSideEffect(entry: SideEffect): Promise<void> {
  await putRecord('sideEffect', entry.id, entry, entry.id);
}

export async function listSymptomEntries(): Promise<SymptomEntry[]> {
  return (await listRecords<Legacy<SymptomEntry>>('symptomEntry'))
    .map(upgradeSymptomEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSymptomEntry(entry: SymptomEntry): Promise<void> {
  await putRecord('symptomEntry', entry.id, entry, entry.id);
}

export async function listCheckIns(): Promise<CheckIn[]> {
  return (await listRecords<CheckIn>('checkIn')).sort((a, b) => a.date.localeCompare(b.date));
}

export async function listAllDoseLogs(): Promise<DoseLog[]> {
  return listRecords<DoseLog>('doseLog');
}

export async function listAppointments(): Promise<Appointment[]> {
  return (await listRecords<Legacy<Appointment>>('appointment'))
    .map(upgradeAppointment)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const found = await findRecord<Legacy<Appointment>>('appointment', id);
  return found ? upgradeAppointment(found) : null;
}

export async function saveAppointment(appointment: Appointment): Promise<void> {
  await putRecord('appointment', appointment.id, appointment, appointment.id);
}

export async function deleteAppointment(id: string): Promise<void> {
  await removeRecord('appointment', id);
}

export async function listQuestions(): Promise<DoctorQuestion[]> {
  return (await listRecords<DoctorQuestion>('question')).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export async function saveQuestion(question: DoctorQuestion): Promise<void> {
  await putRecord('question', question.id, question, question.id);
}

export async function deleteQuestion(id: string): Promise<void> {
  await removeRecord('question', id);
}

export async function listBloodTests(): Promise<BloodTest[]> {
  return (await listRecords<Legacy<BloodTest>>('bloodTest'))
    .map(upgradeBloodTest)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function getBloodTest(id: string): Promise<BloodTest | null> {
  const found = await findRecord<Legacy<BloodTest>>('bloodTest', id);
  return found ? upgradeBloodTest(found) : null;
}

export async function saveBloodTest(test: BloodTest): Promise<void> {
  await putRecord('bloodTest', test.id, test, test.id);
}

export async function deleteBloodTest(id: string): Promise<void> {
  await removeRecord('bloodTest', id);
}

export async function exportAllData(): Promise<string> {
  const [
    consents,
    profile,
    textSize,
    checkIns,
    medications,
    doseLogs,
    sideEffects,
    symptomEntries,
    appointments,
    questions,
    bloodTests,
  ] = await Promise.all([
    getConsents(),
    getProfile(),
    getTextSize(),
    listCheckIns(),
    listMedications(),
    listAllDoseLogs(),
    listSideEffects(),
    listSymptomEntries(),
    listAppointments(),
    listQuestions(),
    listBloodTests(),
  ]);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      consents,
      profile,
      settings: { textSize },
      checkIns,
      medications,
      doseLogs,
      sideEffects,
      symptomEntries,
      appointments,
      questions,
      bloodTests,
    },
    null,
    2,
  );
}

export async function deleteAllData(): Promise<void> {
  await deleteUserDatabase();
  await removeDeviceValue('textSize');
  await removeDeviceValue('deviceOnboarded');
}
