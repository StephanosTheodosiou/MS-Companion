import { Platform } from 'react-native';

const DEV_FALLBACK_URL = Platform.select({
  android: 'http://10.0.2.2:5080',
  default: 'http://localhost:5080',
});

/** Base URL of the MS-Companion API. */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEV_FALLBACK_URL).replace(
  /\/+$/,
  '',
);
