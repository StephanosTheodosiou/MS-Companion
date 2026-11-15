import { Redirect } from 'expo-router';

/**
 * App entry point ("/"). Sends the user to the login screen.
 * Once auth is wired to the API, check `getToken()` here and redirect to "/home" when signed in.
 */
export default function Index() {
  return <Redirect href="/login" />;
}
