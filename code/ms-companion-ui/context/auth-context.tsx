import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import type { LoginRequest, RegisterRequest, Session, User } from '@/types/auth';
import { ApiError, setUnauthorizedHandler } from '@/utils/apiClient';
import { authApi } from '@/utils/authApi';
import { clearSession, getSession, saveSession } from '@/utils/authStorage';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  /** `loading` only while the stored session is read at launch (the splash screen is still up). */
  status: AuthStatus;
  user: User | null;
  /** Throws `ApiError` (401 = wrong email or password). */
  signIn: (request: LoginRequest) => Promise<void>;
  /** Throws `ApiError` (409 = email already registered, 400 = field errors). */
  signUp: (request: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthState = Pick<AuthContextValue, 'status' | 'user'>;

const AuthContext = createContext<AuthContextValue | null>(null);

/** Treat a token as expired slightly early, so it never runs out in the middle of a request. */
const EXPIRY_LEEWAY_MS = 30_000;

function isExpired(session: Session): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isNaN(expiresAt) || expiresAt - EXPIRY_LEEWAY_MS <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const signOut = useCallback(async () => {
    await clearSession();
    setState({ status: 'signedOut', user: null });
  }, []);

  useEffect(() => {
    let active = true;

    async function restore() {
      const session = await getSession();
      if (!active) return;

      if (!session || isExpired(session)) {
        if (session) await clearSession();
        setState({ status: 'signedOut', user: null });
        return;
      }

      setState({ status: 'signedIn', user: session.user });

      try {
        const user = await authApi.me();
        const current = await getSession();
        if (!active || current?.token !== session.token) return; // signed out meanwhile
        await saveSession({ ...session, user });
        setState({ status: 'signedIn', user });
      } catch (error) {
        // 401 is handled by the unauthorized handler below. 404 = the account no longer exists.
        // Anything else (offline, server down) keeps the stored session.
        if (active && error instanceof ApiError && error.status === 404) {
          await signOut();
        }
      }
    }

    void restore();
    return () => {
      active = false;
    };
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    return () => setUnauthorizedHandler(undefined);
  }, [signOut]);

  async function startSession(session: Session) {
    await saveSession(session);
    setState({ status: 'signedIn', user: session.user });
  }

  const value: AuthContextValue = {
    ...state,
    signIn: async (request) => startSession(await authApi.login(request)),
    signUp: async (request) => startSession(await authApi.register(request)),
    signOut,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider> (see app/_layout.tsx).');
  }
  return context;
}
