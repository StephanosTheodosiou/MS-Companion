import type { IconName } from '@/components/ui/app-icon';
import type { ConsentKey } from '@/types/health';

/** Version of the consent text the user agrees to. Sent with every choice (POST /api/consent). */
export const CONSENT_POLICY_VERSION = '1.0';

/** The data types a user can switch on or off (E1). Symptom check-ins are always on. */
export const OPTIONAL_CONSENTS: {
  key: Exclude<ConsentKey, 'symptoms'>;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    key: 'medication',
    label: 'Medication',
    description: 'Your medicine list and dose reminders.',
    icon: 'plus-square',
  },
  {
    key: 'notifications',
    label: 'Reminders',
    description: 'A daily nudge to fill in your check-in.',
    icon: 'bell',
  },
  {
    key: 'location',
    label: 'Location',
    description: 'Only used to warn you about hot days.',
    icon: 'map-pin',
  },
];
