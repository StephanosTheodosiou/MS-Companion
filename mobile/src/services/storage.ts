import {
  Appointment,
  BloodTest,
  CheckIn,
  DoctorQuestion,
  ConsentKey,
  ConsentMap,
  DoseLog,
  EMPTY_PROFILE,
  Medication,
  Profile,
  Session,
  SideEffect,
  SymptomEntry,
  TextSize,
} from '../types';

// TEMPORARY FAKE STORAGE (frontend only).
// The screens only call the functions below. Data is kept in memory, so it is lost
// when the app is closed. The teammate who owns data storage replaces the inside of
// these functions with the real database (or API calls) later, keeping the same
// function names and types, so no screen needs to change.

let consents: ConsentMap = {
  symptoms: false,
  medication: false,
  location: false,
  notifications: false,
};
let profile: Profile = { ...EMPTY_PROFILE };
let onboardingDone = false;
let session: Session | null = null;
let textSize: TextSize = 'normal';
let checkIns: Record<string, CheckIn> = {};
let medications: Medication[] = [];
let doseLogs: DoseLog[] = [];
let sideEffects: SideEffect[] = [];
let symptomEntries: SymptomEntry[] = [];
let appointments: Appointment[] = [];
let questions: DoctorQuestion[] = [];
let bloodTests: BloodTest[] = [];

export async function getConsents(): Promise<ConsentMap> {
  return { ...consents };
}

export async function setConsent(key: ConsentKey, granted: boolean): Promise<void> {
  consents = { ...consents, [key]: granted };
}

export async function saveAllConsents(next: ConsentMap): Promise<void> {
  consents = { ...next };
}

export async function getProfile(): Promise<Profile> {
  return { ...profile };
}

export async function saveProfile(next: Profile): Promise<void> {
  profile = {
    msType: next.msType,
    medication: next.medication.trim(),
    teamName: next.teamName.trim(),
    teamPhone: next.teamPhone.trim(),
  };
}


export async function getSession(): Promise<Session | null> {
  return session ? { ...session } : null;
}

export async function saveSession(next: Session): Promise<void> {
  session = { ...next };
}

export async function clearSession(): Promise<void> {
  session = null;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return onboardingDone;
}

export async function completeOnboarding(): Promise<void> {
  onboardingDone = true;
}

export async function getTextSize(): Promise<TextSize> {
  return textSize;
}

export async function setTextSize(size: TextSize): Promise<void> {
  textSize = size;
}

// ---------- Daily check-in (E2) ----------

/** The check-in for one day (YYYY-MM-DD), or null if there is none yet. */
export async function getCheckIn(date: string): Promise<CheckIn | null> {
  const found = checkIns[date];
  return found ? { ...found, ratings: { ...found.ratings } } : null;
}

/** Saves or replaces the check-in for its day. */
export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  checkIns = { ...checkIns, [checkIn.date]: { ...checkIn, ratings: { ...checkIn.ratings } } };
}

// ---------- Medication (E3) ----------

export async function listMedications(): Promise<Medication[]> {
  return medications.map((m) => ({ ...m, times: [...m.times] }));
}

export async function getMedication(id: string): Promise<Medication | null> {
  const found = medications.find((m) => m.id === id);
  return found ? { ...found, times: [...found.times] } : null;
}

/** Adds a new medication or replaces one with the same id. */
export async function saveMedication(medication: Medication): Promise<void> {
  const copy = { ...medication, times: [...medication.times] };
  const exists = medications.some((m) => m.id === medication.id);
  medications = exists
    ? medications.map((m) => (m.id === medication.id ? copy : m))
    : [...medications, copy];
}

/** Removes a medication. Its past dose logs stay, so the history is complete. */
export async function deleteMedication(id: string): Promise<void> {
  medications = medications.filter((m) => m.id !== id);
}

export async function getDoseLogs(date: string): Promise<DoseLog[]> {
  return doseLogs.filter((l) => l.date === date).map((l) => ({ ...l }));
}

/** Saves or replaces the log for one scheduled dose (medication + date + time). */
export async function logDose(log: DoseLog): Promise<void> {
  const same = (l: DoseLog) =>
    l.medicationId === log.medicationId && l.date === log.date && l.time === log.time;
  doseLogs = [...doseLogs.filter((l) => !same(l)), { ...log }];
}

/** Removes the log for one scheduled dose (undo). */
export async function clearDoseLog(medicationId: string, date: string, time: string): Promise<void> {
  doseLogs = doseLogs.filter(
    (l) => !(l.medicationId === medicationId && l.date === date && l.time === time)
  );
}

export async function listSideEffects(): Promise<SideEffect[]> {
  return [...sideEffects].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function addSideEffect(entry: SideEffect): Promise<void> {
  sideEffects = [...sideEffects, { ...entry }];
}

// ---------- Symptom / relapse log (E3, US-01) ----------

export async function listSymptomEntries(): Promise<SymptomEntry[]> {
  return [...symptomEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSymptomEntry(entry: SymptomEntry): Promise<void> {
  symptomEntries = [...symptomEntries.filter((e) => e.id !== entry.id), { ...entry }];
}

// ---------- History for the visit summary (E7) ----------

export async function listCheckIns(): Promise<CheckIn[]> {
  return Object.values(checkIns)
    .map((c) => ({ ...c, ratings: { ...c.ratings } }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function listAllDoseLogs(): Promise<DoseLog[]> {
  return doseLogs.map((l) => ({ ...l }));
}

// ---------- Appointments (E7) ----------

/** All appointments, earliest first. */
export async function listAppointments(): Promise<Appointment[]> {
  return [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const found = appointments.find((a) => a.id === id);
  return found ? { ...found } : null;
}

export async function saveAppointment(appointment: Appointment): Promise<void> {
  appointments = [...appointments.filter((a) => a.id !== appointment.id), { ...appointment }];
}

export async function deleteAppointment(id: string): Promise<void> {
  appointments = appointments.filter((a) => a.id !== id);
}

// ---------- Questions for the doctor (E7) ----------

/** Oldest first, so questions keep the order they were written in. */
export async function listQuestions(): Promise<DoctorQuestion[]> {
  return [...questions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveQuestion(question: DoctorQuestion): Promise<void> {
  questions = [...questions.filter((q) => q.id !== question.id), { ...question }];
}

export async function deleteQuestion(id: string): Promise<void> {
  questions = questions.filter((q) => q.id !== id);
}

// ---------- Blood-test reminders (E3) ----------

/** All blood tests, soonest due first. */
export async function listBloodTests(): Promise<BloodTest[]> {
  return [...bloodTests].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((t) => ({ ...t }));
}

export async function getBloodTest(id: string): Promise<BloodTest | null> {
  const found = bloodTests.find((t) => t.id === id);
  return found ? { ...found } : null;
}

/** Adds a new blood test or replaces one with the same id. */
export async function saveBloodTest(test: BloodTest): Promise<void> {
  bloodTests = [...bloodTests.filter((t) => t.id !== test.id), { ...test }];
}

export async function deleteBloodTest(id: string): Promise<void> {
  bloodTests = bloodTests.filter((t) => t.id !== id);
}

export async function exportAllData(): Promise<string> {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      consents,
      profile,
      settings: { textSize },
      checkIns: Object.values(checkIns),
      medications,
      doseLogs,
      sideEffects,
      symptomEntries,
      appointments,
      questions,
      bloodTests,
    },
    null,
    2
  );
}

export async function deleteAllData(): Promise<void> {
  consents = { symptoms: false, medication: false, location: false, notifications: false };
  profile = { ...EMPTY_PROFILE };
  onboardingDone = false;
  session = null;
  textSize = 'normal';
  checkIns = {};
  medications = [];
  doseLogs = [];
  sideEffects = [];
  symptomEntries = [];
  appointments = [];
  questions = [];
  bloodTests = [];
}
