import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ms_companion_auth_token';

/**
 * expo-secure-store keeps the JWT in the iOS Keychain / Android Keystore. It has no web
 * implementation, so on web (used only for development) we fall back to localStorage.
 */
const isWeb = Platform.OS === 'web';

export async function saveToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    if (isWeb) {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    // A corrupted/unreadable keychain entry should behave like "not signed in".
    console.warn('Could not read auth token', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
