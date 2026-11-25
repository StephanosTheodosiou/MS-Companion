import type { Profile } from '@/types/health';

// Login, register and logout are already connected to the API in context/auth-context.tsx
// and utils/authApi.ts. What is left here is the profile sync, which is still a placeholder.

export const USE_FAKE_API = true;

export async function pushProfile(_profile: Profile): Promise<{ synced: boolean }> {
  if (USE_FAKE_API) return { synced: false };
  // TODO (Stefanos): PUT /api/patient/me with `api.put` from utils/apiClient.ts. The API uses other names:
  //   teamName -> msTeamName, teamPhone -> msTeamPhone, and timeZone is required (e.g. "Europe/Nicosia").
  //   msType: RRMS -> "RelapsingRemitting", SPMS -> "SecondaryProgressive", PPMS -> "PrimaryProgressive",
  //           CIS -> "ClinicallyIsolatedSyndrome", UNSURE -> "NotSure".
  //   PUT replaces the whole profile, so send back the fields the app does not show (date of birth, ...).
  return { synced: false };
}
