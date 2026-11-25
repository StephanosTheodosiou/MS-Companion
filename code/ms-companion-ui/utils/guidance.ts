// Decides which guidance to show after a new or worse symptom is logged (US-01).
// The app never says whether something IS a relapse (see "Out of scope"); it only
// points the person to the right next step. Kept as a pure function so it can be unit tested.

export type Guidance = 'contact-team' | 'fever-or-heat' | 'keep-watching';

export function symptomGuidance(lastedOver24h: boolean, feverOrHeat: boolean): Guidance {
  if (feverOrHeat) return 'fever-or-heat';
  if (lastedOver24h) return 'contact-team';
  return 'keep-watching';
}

export const GUIDANCE_TEXT: Record<Guidance, { title: string; body: string }> = {
  'contact-team': {
    title: 'Contact your MS team today',
    body: 'New or worse symptoms that last more than 24 hours should be checked by your MS team.',
  },
  'fever-or-heat': {
    title: 'Rest, cool down and keep watching',
    body: 'A fever, an infection or heat can make MS symptoms worse for a short time. If the symptom is still there 24 hours after you have cooled down or the fever has gone, contact your MS team.',
  },
  'keep-watching': {
    title: 'Keep an eye on it',
    body: 'If the symptom is still there after 24 hours, contact your MS team. You can add a new entry then.',
  },
};

export const EMERGENCY_NOTE =
  'If the symptom came on suddenly, is severe, or you feel very unwell, call 112.';
