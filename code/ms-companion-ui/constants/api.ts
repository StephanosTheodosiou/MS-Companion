import { Platform } from 'react-native';

/**
 * Fallbacks for local development when EXPO_PUBLIC_API_URL is not set.
 * A physical phone (Expo Go) can't reach `localhost` on your PC — set EXPO_PUBLIC_API_URL in
 * `.env` to your PC's LAN IP instead (see `.env.example`).
 */
const DEV_FALLBACK_URL = Platform.select({
  android: 'http://10.0.2.2:5080', // Android emulator's alias for the host machine
  default: 'http://localhost:5080',
});

/** Base URL of the MS-Companion API, without a trailing slash. */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEV_FALLBACK_URL).replace(
  /\/+$/,
  '',
);
