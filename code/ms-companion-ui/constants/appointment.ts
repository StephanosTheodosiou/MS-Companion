import type { AppointmentType } from '@/types/health';

/** Appointment types, in the order the form shows them (N3: matches the API's AppointmentType). */
export const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'Neurologist', label: 'Neurologist' },
  { value: 'MsNurse', label: 'MS nurse' },
  { value: 'Infusion', label: 'Infusion' },
  { value: 'BloodTest', label: 'Blood test' },
  { value: 'Mri', label: 'MRI' },
  { value: 'Other', label: 'Other' },
];

export function appointmentTypeLabel(type: AppointmentType): string {
  return APPOINTMENT_TYPES.find((t) => t.value === type)?.label ?? 'Other';
}
