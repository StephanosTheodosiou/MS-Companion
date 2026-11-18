import { BloodTestRepeat, RemindBefore } from '../types';

// Fixed choices keep setting up a reminder to a few big taps.
export const REPEAT_OPTIONS: { value: BloodTestRepeat; label: string }[] = [
  { value: 'none', label: 'Just once' },
  { value: '1', label: 'Every month' },
  { value: '3', label: 'Every 3 months' },
  { value: '6', label: 'Every 6 months' },
  { value: '12', label: 'Every year' },
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
