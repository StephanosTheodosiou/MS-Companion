export type MsType = 'RRMS' | 'SPMS' | 'PPMS' | 'UNSURE';

export type ConsentKey = 'symptoms' | 'medication' | 'location' | 'notifications';
export type ConsentMap = Record<ConsentKey, boolean>;

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Profile {
  msType: MsType | null;
  medication: string;
  teamName: string;
  teamPhone: string;
}

export const EMPTY_PROFILE: Profile = {
  msType: null,
  medication: '',
  teamName: '',
  teamPhone: '',
};

// ---------- Daily check-in (E2) ----------

export type SymptomKey = 'fatigue' | 'mobility' | 'pain' | 'mood' | 'cognition' | 'bladder';

/** 0 = not at all ... 4 = extremely. Higher means the symptom affected the person more. */
export type Rating = 0 | 1 | 2 | 3 | 4;

export interface CheckIn {
  /** Local calendar day, YYYY-MM-DD. One check-in per day. */
  date: string;
  ratings: Record<SymptomKey, Rating>;
  note: string;
  /** ISO timestamp of the last save. */
  savedAt: string;
}
