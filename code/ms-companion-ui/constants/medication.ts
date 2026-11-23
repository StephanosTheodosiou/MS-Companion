import { DoseTime } from '@/types/health';

// Fixed times keep scheduling to a few big taps instead of a clock picker.
export const DOSE_TIMES: { value: DoseTime; label: string }[] = [
  { value: '08:00', label: 'Morning' },
  { value: '13:00', label: 'Midday' },
  { value: '19:00', label: 'Evening' },
  { value: '22:00', label: 'Bedtime' },
];

export function doseTimeLabel(time: DoseTime): string {
  const found = DOSE_TIMES.find((t) => t.value === time);
  return found ? `${found.label}, ${time}` : time;
}

/** Sorts times the way they happen in a day. */
export function sortTimes(times: DoseTime[]): DoseTime[] {
  return [...times].sort((a, b) => a.localeCompare(b));
}
