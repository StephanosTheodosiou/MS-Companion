import { ConsentKey, ConsentMap, EMPTY_PROFILE, Profile, TextSize } from '../types';

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

export async function exportAllData(): Promise<string> {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), consents, profile, settings: { textSize } },
    null,
    2
  );
}

export async function deleteAllData(): Promise<void> {
  consents = { symptoms: false, medication: false, location: false, notifications: false };
  profile = { ...EMPTY_PROFILE };
  onboardingDone = false;
  textSize = 'normal';
}
