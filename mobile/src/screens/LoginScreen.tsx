import React, { useState } from 'react';
import { AppTile } from '../components/AppTile';
import { Button } from '../components/Button';
import { ErrorNote, SafetyCard } from '../components/Notice';
import { PasswordField } from '../components/PasswordField';
import { Screen } from '../components/Screen';
import { SwitchRow } from '../components/Row';
import { Section } from '../components/Section';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { StackProps } from '../navigation/types';
import { AccountError, login } from '../services/api';
import { hasCompletedOnboarding, saveSession } from '../services/storage';
import { validateEmail } from '../utils/validation';

// E1: log in to an existing account. Looks like the Welcome screen, as the way back in.
export function LoginScreen({ navigation }: StackProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const onLogin = async () => {
    const e = validateEmail(email);
    const p = password === '' ? 'Enter your password.' : null;
    setEmailError(e);
    setPasswordError(p);
    setFailure(null);
    if (e || p) return;
    setBusy(true);
    try {
      await saveSession(await login(email, password, rememberMe));
      // Someone who already set up the app on this phone goes straight to Today;
      // on a new phone they choose consent and add their profile first.
      if (await hasCompletedOnboarding()) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.navigate('Consent');
      }
    } catch (err) {
      setFailure(
        err instanceof AccountError && err.kind === 'wrong-credentials'
          ? 'The email or password is not correct.'
          : err instanceof AccountError && err.kind === 'offline'
            ? "We couldn't reach MS Companion. Check your internet connection and try again."
            : 'You were not logged in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      topBar={navigation.canGoBack() ? <TopBar onBack={() => navigation.goBack()} /> : undefined}
      header={<AppTile />}
      title="Welcome back"
      subtitle="Log in to see your check-ins and your visit summary."
      footer={
        <>
          <Button label={busy ? 'Logging in…' : 'Log in'} onPress={onLogin} disabled={busy} />
          <Button label="Create an account" variant="plain" onPress={() => navigation.navigate('Register')} />
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
      <Section>
        <SwitchRow
          icon="smartphone"
          label="Keep me logged in"
          description="On this phone, for up to 30 days."
          value={rememberMe}
          onChange={setRememberMe}
        />
      </Section>
      <SafetyCard>In an emergency, call 112. You do not need to log in for that.</SafetyCard>
    </Screen>
  );
}
