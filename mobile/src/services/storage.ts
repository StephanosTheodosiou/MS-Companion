import { CheckIn, ConsentKey, ConsentMap, EMPTY_PROFILE, Profile, TextSize } from '../types';

// TEMPORARY FAKE STORAGE (frontend only).
// The screens only call the functions below. Data is kept in memory, so it is lost
// when the app is closed. The teammate who owns data storage replaces the inside of
// these functions with the real database (or API calls) later, keeping the same
// function names and types, so no screen needs to change.

let consents: ConsentMap = {
  symptoms: false,
  medication: false,
  location: false,
  notifications: false,
};
let profile: Profile = { ...EMPTY_PROFILE };
let onboardingDone = false;
let textSize: TextSize = 'normal';
let checkIns: Record<string, CheckIn> = {};

export async function getConsents(): Promise<ConsentMap> {
  return { ...consents };
}

export async function setConsent(key: ConsentKey, granted: boolean): Promise<void> {
  consents = { ...consents, [key]: granted };
}

export async function saveAllConsents(next: ConsentMap): Promise<void> {
  consents = { ...next };
}

export async function getProfile(): Promise<Profile> {
  return { ...profile };
}

export async function saveProfile(next: Profile): Promise<void> {
  profile = {
    msType: next.msType,
    medication: next.medication.trim(),
    teamName: next.teamName.trim(),
    teamPhone: next.teamPhone.trim(),
  };
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return onboardingDone;
}

export async function completeOnboarding(): Promise<void> {
  onboardingDone = true;
}

export async function getTextSize(): Promise<TextSize> {
  return textSize;
}

export async function setTextSize(size: TextSize): Promise<void> {
  textSize = size;
}

// ---------- Daily check-in (E2) ----------

/** The check-in for one day (YYYY-MM-DD), or null if there is none yet. */
export async function getCheckIn(date: string): Promise<CheckIn | null> {
  const found = checkIns[date];
  return found ? { ...found, ratings: { ...found.ratings } } : null;
}

/** Saves or replaces the check-in for its day. */
export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  checkIns = { ...checkIns, [checkIn.date]: { ...checkIn, ratings: { ...checkIn.ratings } } };
}

export async function exportAllData(): Promise<string> {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      consents,
      profile,
      settings: { textSize },
      checkIns: Object.values(checkIns),
    },
    null,
    2
  );
}

export async function deleteAllData(): Promise<void> {
  consents = { symptoms: false, medication: false, location: false, notifications: false };
  profile = { ...EMPTY_PROFILE };
  onboardingDone = false;
  textSize = 'normal';
  checkIns = {};
}
