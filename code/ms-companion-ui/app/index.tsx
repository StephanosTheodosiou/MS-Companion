import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { hasCompletedOnboarding } from '@/utils/storage';

/**
 * App entry point ("/") and the anchor protected routes fall back to after signing in or out.
 *   signed in, setup finished     -> Today (home tab)
 *   signed in, setup not finished -> consent and profile setup (E1)
 *   signed out after setting up   -> Log in
 *   first launch                  -> Welcome
 */
export default function Index() {
  const { status } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    let active = true;
    hasCompletedOnboarding()
      .then((done) => active && setOnboarded(done))
      .catch(() => active && setOnboarded(false));
    return () => {
      active = false;
    };
  }, [status]);

  if (status === 'loading' || onboarded === null) {
    return null; // the native splash screen is still showing
  }

  let href: Href;
  if (status === 'signedIn') {
    href = onboarded ? '/home' : '/consent';
  } else {
    href = onboarded ? '/login' : '/welcome';
  }
  return <Redirect href={href} />;
}
