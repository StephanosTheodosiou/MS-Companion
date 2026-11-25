export type MsType = 'RRMS' | 'SPMS' | 'PPMS' | 'CIS' | 'UNSURE';

export type ConsentKey = 'symptoms' | 'medication' | 'location' | 'notifications';
export type ConsentMap = Record<ConsentKey, boolean>;

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Profile {
  msType: MsType | null;
  medication: string;
  teamName: string;
  teamPhone: string;
}

export const EMPTY_PROFILE: Profile = {
  msType: null,
  medication: '',
  teamName: '',
  teamPhone: '',
};

// ---------- Daily check-in (E2) ----------

export type SymptomKey = 'fatigue' | 'mobility' | 'pain' | 'mood' | 'cognition' | 'bladder';

/** 0 = not at all ... 4 = extremely. Higher means the symptom affected the person more. */
export type Rating = 0 | 1 | 2 | 3 | 4;

export interface CheckIn {
  /** Local calendar day, YYYY-MM-DD. One check-in per day. */
  date: string;
  ratings: Record<SymptomKey, Rating>;
  note: string;
  /** ISO timestamp of the last save. */
  savedAt: string;
}

// ---------- Medication (E3) ----------

/** Times of day a dose can be scheduled, as HH:MM. */
export type DoseTime = '08:00' | '13:00' | '19:00' | '22:00';

export interface Medication {
  id: string;
  name: string;
  /** Free text, e.g. "500 mg, 1 tablet". */
  dose: string;
  times: DoseTime[];
}

export type DoseStatus = 'taken' | 'skipped';

export interface DoseLog {
  medicationId: string;
  /** YYYY-MM-DD */
  date: string;
  time: DoseTime;
  status: DoseStatus;
  loggedAt: string;
}

export interface SideEffect {
  id: string;
  medicationId: string;
  description: string;
  loggedAt: string;
}

// ---------- Relapse log (E3, user story US-01) ----------

export type SyncStatus = 'waiting' | 'synced';

export interface SymptomEntry {
  id: string;
  description: string;
  /** YYYY-MM-DD the symptom started. */
  startedOn: string;
  lastedOver24h: boolean;
  /** Fever, infection or heat can briefly make MS symptoms worse. */
  feverOrHeat: boolean;
  createdAt: string;
  /** Scenario 2: saved on the phone first, uploaded when back online. */
  syncStatus: SyncStatus;
}

// ---------- Appointments and visit preparation (E7) ----------

export interface Appointment {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24-hour */
  time: string;
  /** Who the visit is with, e.g. "Dr Andreas". */
  withWhom: string;
  place: string;
  notes: string;
}

export interface DoctorQuestion {
  id: string;
  text: string;
  createdAt: string;
  /** Ticked off once it has been asked at a visit. */
  asked: boolean;
}

// ---------- Blood-test reminders (E3) ----------

/** How often a blood test comes round, in months. 'none' means a one-off test. */
export type BloodTestRepeat = 'none' | '1' | '3' | '6' | '12';

/** How many days before the due date the reminder is sent. */
export type RemindBefore = '0' | '1' | '7';

export interface BloodTest {
  id: string;
  /** What the test is called, e.g. "Full blood count". Free text. */
  name: string;
  /** YYYY-MM-DD the test is due. */
  dueDate: string;
  repeat: BloodTestRepeat;
  remindDaysBefore: RemindBefore;
  notes: string;
  /** YYYY-MM-DD the test was last marked as done, or null if never. */
  lastDoneOn: string | null;
}
