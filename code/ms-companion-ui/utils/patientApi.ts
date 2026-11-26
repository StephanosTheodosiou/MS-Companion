import { CONSENT_POLICY_VERSION } from '@/constants/consent';
import type { ConsentKey, ConsentMap, MsType, Profile } from '@/types/health';
import { api } from '@/utils/apiClient';

// N4: profile and consent on the server, through the shared API client (it adds the login token).
//   GET /api/patient/me   PUT /api/patient/me   GET /api/consent   POST /api/consent
// The app and the API use different names for some values; the maps below translate both ways.

// ---------- Names used by the API ----------

type ApiMsType =
  | 'RelapsingRemitting'
  | 'SecondaryProgressive'
  | 'PrimaryProgressive'
  | 'ClinicallyIsolatedSyndrome'
  | 'NotSure';

type ApiConsentDataType =
  | 'SymptomCheckins'
  | 'Medication'
  | 'Reminders'
  | 'Location'
  | 'FunctionTests'
  | 'PassiveSensing'
  | 'CaregiverSharing';

/** GET/PUT /api/patient/me (PatientDto). Every field except timeZone may be null. */
interface PatientDto {
  preferredName: string | null;
  /** "yyyy-MM-dd" */
  dateOfBirth: string | null;
  msType: ApiMsType | null;
  diagnosisYear: number | null;
  msTeamName: string | null;
  msTeamPhone: string | null;
  timeZone: string;
}

/** One entry of GET /api/consent (ConsentStateDto). decidedAt is null if never decided. */
interface ConsentStateDto {
  dataType: ApiConsentDataType;
  granted: boolean;
  decidedAt: string | null;
}

const MS_TYPE_TO_API: Record<MsType, ApiMsType> = {
  RRMS: 'RelapsingRemitting',
  SPMS: 'SecondaryProgressive',
  PPMS: 'PrimaryProgressive',
  CIS: 'ClinicallyIsolatedSyndrome',
  UNSURE: 'NotSure',
};

const MS_TYPE_FROM_API = Object.fromEntries(
  Object.entries(MS_TYPE_TO_API).map(([app, server]) => [server, app]),
) as Record<ApiMsType, MsType>;

const CONSENT_TO_API: Record<ConsentKey, ApiConsentDataType> = {
  symptoms: 'SymptomCheckins',
  medication: 'Medication',
  location: 'Location',
  notifications: 'Reminders',
};

const CONSENT_KEYS = Object.keys(CONSENT_TO_API) as ConsentKey[];

/** The phone's IANA time zone, e.g. "Europe/Nicosia" (the API requires one). */
function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim());

// ---------- Profile ----------

/** The profile fields the server keeps, in the app's names. */
export type ServerProfile = Pick<Profile, 'msType' | 'teamName' | 'teamPhone' | 'dateOfBirth'>;

export async function fetchProfile(): Promise<ServerProfile> {
  const p = await api.get<PatientDto>('/api/patient/me');
  return {
    msType: p.msType ? MS_TYPE_FROM_API[p.msType] : null,
    teamName: p.msTeamName ?? '',
    teamPhone: p.msTeamPhone ?? '',
    dateOfBirth: p.dateOfBirth,
  };
}

/**
 * Saves the profile on the server. PUT replaces the whole profile, so the fields the app does not
 * show yet (preferred name, diagnosis year) are read first and sent back unchanged.
 */
export async function pushProfile(profile: Profile): Promise<void> {
  const current = await api.get<PatientDto>('/api/patient/me');
  const body: PatientDto = {
    preferredName: current.preferredName,
    diagnosisYear: current.diagnosisYear,
    dateOfBirth: profile.dateOfBirth,
    msType: profile.msType ? MS_TYPE_TO_API[profile.msType] : null,
    msTeamName: blankToNull(profile.teamName),
    msTeamPhone: blankToNull(profile.teamPhone),
    timeZone: deviceTimeZone() ?? current.timeZone ?? 'Europe/Nicosia',
  };
  await api.put<PatientDto>('/api/patient/me', body);
}

// ---------- Consent ----------

export interface ServerConsents {
  /** The current choice per data type (false when never decided). */
  consents: ConsentMap;
  /** True when the user has at least one consent record, i.e. finished the consent step before. */
  decided: boolean;
}

export async function fetchConsents(): Promise<ServerConsents> {
  const states = await api.get<ConsentStateDto[]>('/api/consent');
  const granted = (key: ConsentKey) =>
    states.some((s) => s.dataType === CONSENT_TO_API[key] && s.granted);
  return {
    consents: {
      symptoms: granted('symptoms'),
      medication: granted('medication'),
      location: granted('location'),
      notifications: granted('notifications'),
    },
    decided: states.some((s) => s.decidedAt !== null),
  };
}

/**
 * Records consent choices on the server, in one request. Pass all of them (onboarding)
 * or only the ones that changed (a switch in Profile). Symptom check-ins are always sent as
 * granted: the API refuses to withdraw them (the user deletes their data instead).
 */
export async function pushConsents(changes: Partial<ConsentMap>): Promise<void> {
  const decisions = CONSENT_KEYS.filter((key) => changes[key] !== undefined).map((key) => ({
    dataType: CONSENT_TO_API[key],
    granted: key === 'symptoms' ? true : changes[key] === true,
  }));
  if (decisions.length === 0) return;
  await api.post('/api/consent', { policyVersion: CONSENT_POLICY_VERSION, decisions });
}
