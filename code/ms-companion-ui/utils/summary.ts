import { RATING_OPTIONS, SYMPTOMS, LOW_MOOD_THRESHOLD } from '@/constants/check-in';
import {
  Appointment,
  CheckIn,
  DoctorQuestion,
  DoseLog,
  Medication,
  Rating,
  SideEffect,
  SymptomEntry,
  SymptomKey,
} from '@/types/health';
import { daysAgoKey, daysBetween, todayKey } from '@/utils/date';

// Builds the one-page visit summary (E7) from everything logged since the last visit.
// Pure function: no storage or screen code, so it is easy to unit test.

export interface SymptomSummary {
  key: SymptomKey;
  name: string;
  /** Average rating 0-4 over the period, or null with no check-ins. */
  average: number | null;
  worst: Rating | null;
  /** Average of the most recent half minus the first half; positive means worse lately. */
  change: number | null;
}

export interface VisitSummary {
  /** Start of the period (YYYY-MM-DD): the last visit, or 30 days ago if there was none. */
  from: string;
  to: string;
  days: number;
  lastVisit: Appointment | null;
  nextVisit: Appointment | null;
  checkInDays: number;
  symptoms: SymptomSummary[];
  lowMoodDays: number;
  symptomEntries: SymptomEntry[];
  dosesTaken: number;
  dosesSkipped: number;
  /** date is when the side effect started; severity is null for entries saved before it was asked. */
  sideEffects: { description: string; medicine: string; severity: string | null; date: string }[];
  openQuestions: DoctorQuestion[];
}

export const DEFAULT_PERIOD_DAYS = 30;

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function buildVisitSummary(input: {
  today?: string;
  appointments: Appointment[];
  checkIns: CheckIn[];
  symptomEntries: SymptomEntry[];
  doseLogs: DoseLog[];
  medications: Medication[];
  sideEffects: SideEffect[];
  questions: DoctorQuestion[];
}): VisitSummary {
  const today = input.today ?? todayKey();
  const sorted = [...input.appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  const past = sorted.filter((a) => a.date < today);
  const lastVisit = past.length ? past[past.length - 1] : null;
  const nextVisit = sorted.find((a) => a.date >= today) ?? null;

  const from = lastVisit ? lastVisit.date : daysAgoKey(DEFAULT_PERIOD_DAYS, parseKey(today));
  const inPeriod = (date: string) => date >= from && date <= today;

  const checkIns = input.checkIns
    .filter((c) => inPeriod(c.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const symptoms: SymptomSummary[] = SYMPTOMS.map(({ key, name }) => {
    // Skips check-ins without this question, so questions can be added to the check-in later
    // without breaking the summary for older days.
    const values = checkIns.map((c) => c.ratings[key]).filter((v): v is Rating => v !== undefined);
    const half = Math.floor(values.length / 2);
    const avg = average(values);
    const early = average(values.slice(0, half));
    const late = average(values.slice(values.length - half));
    return {
      key,
      name,
      average: avg,
      worst: values.length ? (Math.max(...values) as Rating) : null,
      change: half >= 2 && early !== null && late !== null ? late - early : null,
    };
  });

  const logs = input.doseLogs.filter((l) => inPeriod(l.date));
  const medName = (id: string | null) =>
    id === null
      ? 'Medicine not known'
      : (input.medications.find((m) => m.id === id)?.name ?? 'Removed medicine');

  return {
    from,
    to: today,
    days: daysBetween(from, today),
    lastVisit,
    nextVisit,
    checkInDays: checkIns.length,
    symptoms,
    lowMoodDays: checkIns.filter((c) => c.ratings.mood >= LOW_MOOD_THRESHOLD).length,
    symptomEntries: input.symptomEntries
      .filter((e) => inPeriod(todayKey(new Date(e.createdAt))))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    dosesTaken: logs.filter((l) => l.status === 'taken').length,
    dosesSkipped: logs.filter((l) => l.status === 'skipped').length,
    sideEffects: input.sideEffects
      .filter((s) => inPeriod(todayKey(new Date(s.loggedAt))))
      .map((s) => ({
        description: s.description,
        medicine: medName(s.medicationId),
        severity: s.severity,
        date: s.startedOn,
      })),
    openQuestions: input.questions.filter((q) => !q.asked),
  };
}

/** "1.4 of 4, mostly A little" */
export function describeAverage(avg: number): string {
  const label = RATING_OPTIONS[Math.min(4, Math.round(avg))].label;
  return `${avg.toFixed(1)} of 4, mostly ${label.toLowerCase()}`;
}

/** "Worse lately", "Better lately" or "Steady", using a 0.5 point threshold. */
export function describeChange(change: number | null): string | null {
  if (change === null) return null;
  if (change >= 0.5) return 'Worse lately';
  if (change <= -0.5) return 'Better lately';
  return 'Steady';
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "with fever or infection", "after heat exposure", both, or null. Used by the summary screen and the PDF. */
export function feverHeatNote(e: Pick<SymptomEntry, 'hadFever' | 'heatExposure'>): string | null {
  if (e.hadFever && e.heatExposure) return 'with fever or infection, and heat exposure';
  if (e.hadFever) return 'with fever or infection';
  if (e.heatExposure) return 'after heat exposure';
  return null;
}
