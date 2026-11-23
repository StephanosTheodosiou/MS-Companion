import type { Appointment } from '@/types/health';
import { formatShortDate } from '@/utils/date';

export function appointmentTitle(a: Appointment): string {
  return `${formatShortDate(a.date)} · ${a.time}`;
}

export function appointmentDetails(a: Appointment): string | undefined {
  return [a.withWhom, a.place].filter(Boolean).join(' · ') || undefined;
}
