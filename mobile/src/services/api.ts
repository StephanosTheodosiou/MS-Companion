import { Profile, Session } from '../types';

// The backend (C# / ASP.NET Core) is not ready yet, so every function here is a placeholder.
// When Rafael's API is ready, only this file needs to change.
// Agree the JSON field names with him early (they should match the `Profile` type).

export const USE_FAKE_API = true;

// The API listens on port 5080 (code/ms-companion-api/.../launchSettings.json).
// 10.0.2.2 is how the Android emulator reaches the laptop. A real phone needs the laptop's IP address.
export const BASE_URL = 'http://10.0.2.2:5080';

export async function pushProfile(_profile: Profile): Promise<{ synced: boolean }> {
  if (USE_FAKE_API) return { synced: false };
  // TODO (Stefanos): PUT `${BASE_URL}/api/patient/me`. The API uses other names:
  //   teamName -> msTeamName, teamPhone -> msTeamPhone, and timeZone is required (e.g. "Europe/Nicosia").
  //   msType: RRMS -> "RelapsingRemitting", SPMS -> "SecondaryProgressive", PPMS -> "PrimaryProgressive",
  //           CIS -> "ClinicallyIsolatedSyndrome", UNSURE -> "NotSure".
  //   PUT replaces the whole profile, so send back the fields the app does not show (date of birth, ...).
  return { synced: false };
}

// ---------- Account ----------
// Placeholders for Stefanos's card "Connect the app to the backend". The inputs and results
// already match the API (code/ms-companion-api, AuthController), so only the inside changes.

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** "Keep me logged in": the API then also returns a refresh token. */
  rememberMe: boolean;
}

/**
 * The one error type the login and register screens understand.
 * When connecting the API, turn its answers into these:
 *   409 from /register  -> 'email-taken'
 *   401 from /login     -> 'wrong-credentials'
 *   400 with field errors -> 'invalid' (fieldErrors: { email: '...', password: '...' })
 *   no connection       -> 'offline'
 *   anything else       -> 'other'
 */
export class AccountError extends Error {
  constructor(
    readonly kind: 'email-taken' | 'wrong-credentials' | 'invalid' | 'offline' | 'other',
    message: string,
    readonly fieldErrors: Partial<Record<'firstName' | 'lastName' | 'email' | 'password', string>> = {}
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

/** A small wait so the loading state on the buttons can be seen while testing. */
const fakeDelay = () => new Promise((resolve) => setTimeout(resolve, 600));

/**
 * To try the error messages without a backend:
 * an email ending in "@taken.test" counts as already registered,
 * and the password "wrong-password" counts as wrong.
 */
function fakeSession(email: string, firstName: string, lastName: string): Session {
  return {
    token: 'fake-token',
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'fake', email: email.trim().toLowerCase(), firstName, lastName, role: 'User' },
  };
}

/** POST /api/auth/register -> AuthResponse (201). */
export async function register(input: RegisterInput): Promise<Session> {
  if (USE_FAKE_API) {
    await fakeDelay();
    if (input.email.trim().toLowerCase().endsWith('@taken.test')) {
      throw new AccountError('email-taken', 'An account with this email already exists.');
    }
    return fakeSession(input.email, input.firstName.trim(), input.lastName.trim());
  }
  // TODO (Stefanos): POST `${BASE_URL}/api/auth/register` with RegisterInput; map errors to AccountError.
  throw new AccountError('other', 'Registration is not connected yet.');
}

/** POST /api/auth/login -> AuthResponse (200). */
export async function login(email: string, password: string, rememberMe: boolean): Promise<Session> {
  if (USE_FAKE_API) {
    await fakeDelay();
    void rememberMe;
    if (password === 'wrong-password') {
      throw new AccountError('wrong-credentials', 'The email or password is not correct.');
    }
    return fakeSession(email, 'Demo', 'User');
  }
  // TODO (Stefanos): POST `${BASE_URL}/api/auth/login` with { email, password, rememberMe }; map errors to AccountError.
  throw new AccountError('other', 'Login is not connected yet.');
}

/** POST /api/auth/logout (needs the token). Logging out on the phone works even if this fails. */
export async function logout(_session: Session): Promise<void> {
  if (USE_FAKE_API) return;
  // TODO (Stefanos): POST `${BASE_URL}/api/auth/logout` with the token.
}
