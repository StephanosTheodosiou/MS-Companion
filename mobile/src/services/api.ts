import { Profile } from '../types';

// The backend (C# / ASP.NET Core) is not ready yet, so every function here is a placeholder.
// When Rafael's API is ready, only this file needs to change.
// Agree the JSON field names with him early (they should match the `Profile` type).

export const USE_FAKE_API = true;

// 10.0.2.2 is how the Android emulator reaches the laptop. A real phone needs the laptop's IP address.
export const BASE_URL = 'http://10.0.2.2:5000';

export async function pushProfile(_profile: Profile): Promise<{ synced: boolean }> {
  if (USE_FAKE_API) return { synced: false };
  // TODO: POST `${BASE_URL}/api/profile` with the profile as JSON.
  return { synced: false };
}
