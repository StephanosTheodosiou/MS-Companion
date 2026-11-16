import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Session } from '@/types/auth';

const SESSION_KEY = 'ms_companion.session';

const isWeb = Platform.OS === 'web';

let cached: Session | null | undefined;

export async function saveSession(session: Session): Promise<void> {
  cached = session;
  const value = JSON.stringify(session);
  if (isWeb) {
    globalThis.localStorage?.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function getSession(): Promise<Session | null> {
  if (cached !== undefined) {
    return cached;
  }
  try {
    const value = isWeb
      ? (globalThis.localStorage?.getItem(SESSION_KEY) ?? null)
      : await SecureStore.getItemAsync(SESSION_KEY);
    cached = value ? parseSession(value) : null;
  } catch (error) {
    console.warn('Could not read the stored session', error);
    cached = null;
  }
  return cached;
}

export async function clearSession(): Promise<void> {
  cached = null;
  try {
    if (isWeb) {
      globalThis.localStorage?.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.warn('Could not clear the stored session', error);
  }
}

export async function getToken(): Promise<string | null> {
  return (await getSession())?.token ?? null;
}

function parseSession(value: string): Session | null {
  try {
    const data = JSON.parse(value) as Partial<Session>;
    const isValid =
      typeof data.token === 'string' && typeof data.expiresAt === 'string' && !!data.user;
    return isValid ? (data as Session) : null;
  } catch {
    return null;
  }
}
