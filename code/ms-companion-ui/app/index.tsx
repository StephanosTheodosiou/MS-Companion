import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { fetchConsents } from '@/utils/patientApi';
import { completeOnboarding, hasCompletedOnboarding } from '@/utils/storage';

/**
 * Signed in: setup is done when the server already has the user's consent choices (N4).
 * This works on a new phone too. Offline, the flag saved on this phone is used instead.
 */
async function isOnboarded(signedIn: boolean): Promise<boolean> {
  if (!signedIn) return hasCompletedOnboarding();
  try {
    const { decided } = await fetchConsents();
    if (decided) await completeOnboarding().catch(() => {}); // remember it for offline starts
    return decided;
  } catch (e) {
    console.warn('Could not check setup with the server', e);
    return hasCompletedOnboarding();
  }
}

/**
 * App entry point ("/") and the anchor protected routes fall back to after signing in or out.
 *   signed in, setup finished     -> Today (home tab); "finished" comes from the server, see isOnboarded
 *   signed in, setup not finished -> consent and profile setup (E1)
 *   signed out after setting up   -> Log in
 *   first launch                  -> Welcome
 */
export default function Index() {
  const { status } = useAuth();
  // Each answer remembers which login state it was checked for, so an answer from before
  // signing in or out is never used to pick the next screen.
  const [checked, setChecked] = useState<{ status: string; done: boolean } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    let active = true;
    isOnboarded(status === 'signedIn')
      .then((done) => active && setChecked({ status, done }))
      .catch(() => active && setChecked({ status, done: false }));
    return () => {
      active = false;
    };
  }, [status]);

  const onboarded = checked?.status === status ? checked.done : null;
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
