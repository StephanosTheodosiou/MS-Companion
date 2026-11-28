import { appointmentTypeLabel } from '@/constants/appointment';
import type { Appointment } from '@/types/health';
import { formatShortDate, todayKey } from '@/utils/date';

/** "Mon 30 Nov · 10:30–11:15" (no end time for entries saved before it was asked). */
export function appointmentTitle(a: Appointment): string {
  const times = a.endTime ? `${a.time}–${a.endTime}` : a.time;
  return `${formatShortDate(a.date)} · ${times}`;
}

/** "Neurologist · Dr Andreas · Nicosia General Hospital" */
export function appointmentDetails(a: Appointment): string | undefined {
  return (
    [appointmentTypeLabel(a.type), a.withWhom, a.place].filter(Boolean).join(' · ') || undefined
  );
}

// ---------- Next and upcoming appointments (F16) ----------
// One rule for every screen (Home, Visit tab, Appointments list, visit summary): compare the date
// AND the time. An appointment has passed once it has ended (or started, if it has no end time),
// so a visit that is happening right now still counts as the next one.

/** "YYYY-MM-DD HH:MM" for now, in the phone's local time. */
export function nowStamp(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${todayKey(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const startStamp = (a: Appointment) => `${a.date} ${a.time}`;
const endStamp = (a: Appointment) => `${a.date} ${a.endTime ?? a.time}`;

/** True once the appointment is over. */
export function hasPassed(a: Appointment, now: Date = new Date()): boolean {
  return endStamp(a) <= nowStamp(now);
}

const byStart = (a: Appointment, b: Appointment) => startStamp(a).localeCompare(startStamp(b));

/** Appointments that have not ended yet, soonest first. */
export function upcomingAppointments(all: Appointment[], now: Date = new Date()): Appointment[] {
  return all.filter((a) => !hasPassed(a, now)).sort(byStart);
}

/** Appointments that are over, most recent first. */
export function pastAppointments(all: Appointment[], now: Date = new Date()): Appointment[] {
  return all.filter((a) => hasPassed(a, now)).sort(byStart).reverse();
}

/** The next appointment that has not ended yet, or null. */
export function nextAppointment(all: Appointment[], now: Date = new Date()): Appointment | null {
  return upcomingAppointments(all, now)[0] ?? null;
}
