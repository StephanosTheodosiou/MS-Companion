import type { IconName } from '@/components/ui/app-icon';
import { Rating, SymptomKey } from '@/types/health';

// The six areas from Epic 2, each asked as "how much did it affect you today".
// The answer wording follows the 5-point format used by common patient-reported
// questionnaires (e.g. MSIS-29). The team should confirm the final scale against
// the published source cited in the report.
export const SYMPTOMS: { key: SymptomKey; name: string; question: string; icon: IconName }[] = [
  { key: 'fatigue', name: 'Fatigue', question: 'How much has fatigue affected you today?', icon: 'battery' },
  {
    key: 'mobility',
    name: 'Walking and balance',
    question: 'How much have walking or balance problems affected you today?',
    icon: 'mci:walk',
  },
  { key: 'pain', name: 'Pain', question: 'How much has pain affected you today?', icon: 'zap' },
  { key: 'mood', name: 'Mood', question: 'How much has low mood affected you today?', icon: 'smile' },
  {
    key: 'cognition',
    name: 'Memory and concentration',
    question: 'How much have memory or concentration problems affected you today?',
    icon: 'mci:brain',
  },
  { key: 'bladder', name: 'Bladder', question: 'How much have bladder problems affected you today?', icon: 'droplet' },
];

export const RATING_OPTIONS: { value: Rating; label: string }[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Moderately' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Extremely' },
];

export function ratingLabel(rating: Rating): string {
  return RATING_OPTIONS.find((o) => o.value === rating)?.label ?? '';
}

// E2: a mood rating at or above this shows a support message after saving.
export const LOW_MOOD_THRESHOLD: Rating = 3;
