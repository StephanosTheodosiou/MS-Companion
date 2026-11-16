import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

/**
 * App entry point ("/") and the anchor protected routes fall back to after signing in or out.
 * TODO(onboarding): send newly registered users to the welcome / data-choices flow before home.
 */
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null; // the native splash screen is still showing
  }

  return <Redirect href={status === 'signedIn' ? '/home' : '/login'} />;
}
