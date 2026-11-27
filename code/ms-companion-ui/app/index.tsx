import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { fetchConsents, pushConsents } from '@/utils/patientApi';
import { completeOnboarding, getConsents, hasCompletedOnboarding } from '@/utils/storage';

async function isOnboarded(signedIn: boolean): Promise<boolean> {
  if (await hasCompletedOnboarding()) {
    if (signedIn) void recordConsentsIfMissing();
    return true;
  }
  if (!signedIn) return false;
  try {
    const { decided } = await fetchConsents();
    if (decided) await completeOnboarding().catch(() => {});
    return decided;
  } catch (e) {
    console.warn('Could not check setup with the server', e);
    return false;
  }
}

async function recordConsentsIfMissing(): Promise<void> {
  try {
    const { decided } = await fetchConsents();
    if (!decided) await pushConsents(await getConsents());
  } catch (e) {
    console.warn('Could not check consent with the server', e);
  }
}

/**
 * App entry point ("/") and the anchor protected routes fall back to after signing in or out.
 *   signed in, setup finished     -> Today (home tab); a new phone asks the server
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
