import { appointmentTypeLabel } from '@/constants/appointment';
import type { Appointment } from '@/types/health';
import { formatShortDate } from '@/utils/date';

/** "Mon 30 Nov · 10:30–11:15" (no end time for entries saved before it was asked). */
export function appointmentTitle(a: Appointment): string {
  const times = a.endTime ? `${a.time}–${a.endTime}` : a.time;
  return `${formatShortDate(a.date)} · ${times}`;
}

/** "Neurologist · Dr Andreas · Nicosia General Hospital" */
export function appointmentDetails(a: Appointment): string | undefined {
  return [appointmentTypeLabel(a.type), a.withWhom, a.place].filter(Boolean).join(' · ') || undefined;
}
