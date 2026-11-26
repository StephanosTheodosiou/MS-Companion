import { BloodTestRepeat, RemindBefore } from '@/types/health';

// Fixed choices keep setting up a reminder to a few big taps.
// The API counts in weeks (repeatEveryWeeks), so the values are weeks; the labels add the months
// patients usually hear from their clinic.
export const REPEAT_OPTIONS: { value: BloodTestRepeat; label: string }[] = [
  { value: 'none', label: 'Just once' },
  { value: '4', label: 'Every 4 weeks' },
  { value: '13', label: 'Every 13 weeks (about 3 months)' },
  { value: '26', label: 'Every 26 weeks (about 6 months)' },
  { value: '52', label: 'Every 52 weeks (1 year)' },
];

export const REMIND_OPTIONS: { value: RemindBefore; label: string }[] = [
  { value: '0', label: 'On the day' },
  { value: '1', label: '1 day before' },
  { value: '7', label: '1 week before' },
];

export function repeatLabel(repeat: BloodTestRepeat): string {
  return REPEAT_OPTIONS.find((o) => o.value === repeat)?.label ?? '';
}

/** A test counts as "due soon" this many days before its due date. */
export const SOON_DAYS = 14;
