import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppTile } from '@/components/brand/app-tile';
import { Button } from '@/components/ui/app-button';
import { ErrorNote, SafetyCard } from '@/components/ui/notice';
import { PasswordField } from '@/components/ui/app-password-field';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/utils/apiClient';
import { validateEmail, validateLoginPassword } from '@/utils/validation';

// E1: log in to an existing account. Looks like the Welcome screen, as the way back in.
export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (busy) return;
    const e = validateEmail(email) ?? null;
    const p = validateLoginPassword(password) ?? null;
    setEmailError(e);
    setPasswordError(p);
    setFailure(null);
    if (e || p) return;
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      // No navigation here: the auth guard in app/_layout.tsx switches to the signed-in screens,
      // and app/index.tsx sends the user to Today or, on a new phone, to consent and profile setup.
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) {
        setFailure('The email or password is not correct.');
      } else if (err instanceof ApiError && err.isNetworkError) {
        setFailure("We couldn't reach MS Companion. Check your internet connection and try again.");
      } else if (err instanceof ApiError && (err.fieldErrors.email || err.fieldErrors.password)) {
        setEmailError(err.fieldErrors.email ?? null);
        setPasswordError(err.fieldErrors.password ?? null);
      } else {
        setFailure('You were not logged in. Please try again.');
      }
    }
  };

  return (
    <Screen
      topBar={router.canGoBack() ? <TopBar onBack={() => router.back()} /> : undefined}
      header={<AppTile />}
      title="Welcome back"
      subtitle="Log in to see your check-ins and your visit summary."
      footer={
        <>
          <Button label={busy ? 'Logging in…' : 'Log in'} onPress={onLogin} disabled={busy} />
          <Button label="Create an account" variant="plain" onPress={() => router.push('/register')} />
        </>
      }
    >
      {failure ? <ErrorNote>{failure}</ErrorNote> : null}
      <Section variant="plain">
        <TextField
          label="Email"
          icon="mail"
          placeholder="name@example.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          error={emailError}
        />
        <PasswordField
          kind="current"
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (passwordError) setPasswordError(null);
          }}
          error={passwordError}
        />
      </Section>
      <SafetyCard>In an emergency, call 112. You do not need to log in for that.</SafetyCard>
    </Screen>
  );
}
