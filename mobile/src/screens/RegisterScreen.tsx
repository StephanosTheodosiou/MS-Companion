import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ErrorNote, Note } from '../components/Notice';
import { PasswordField } from '../components/PasswordField';
import { SwitchRow } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { StepHeader } from '../components/StepHeader';
import { TextField } from '../components/TextField';
import { StackProps } from '../navigation/types';
import { AccountError, register } from '../services/api';
import { saveSession } from '../services/storage';
import { MIN_PASSWORD_LENGTH, validateEmail, validateNewPassword } from '../utils/validation';

export const SETUP_STEPS = 4;

type Field = 'firstName' | 'lastName' | 'email' | 'password' | 'confirm';

// E1, step 2 of 4: create an account. The fields match the API's RegisterRequest.
export function RegisterScreen({ navigation }: StackProps<'Register'>) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clear = (field: Field) => setErrors((e) => (e[field] ? { ...e, [field]: null } : e));

  const onCreate = async () => {
    const p = validateNewPassword(password);
    const next: Partial<Record<Field, string | null>> = {
      firstName: firstName.trim() ? null : 'Enter your first name.',
      lastName: lastName.trim() ? null : 'Enter your last name.',
      email: validateEmail(email),
      password: p,
      confirm: !p && confirm !== password ? 'The two passwords are not the same.' : null,
    };
    setErrors(next);
    setFailure(null);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try {
      const session = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        password,
        rememberMe,
      });
      await saveSession(session);
      navigation.navigate('Consent');
    } catch (err) {
      if (err instanceof AccountError && err.kind === 'email-taken') {
        setErrors({ email: 'An account with this email already exists. Log in instead.' });
      } else if (err instanceof AccountError && err.kind === 'invalid') {
        // The server checks the same fields; show its messages under the matching field.
        setErrors({ ...err.fieldErrors });
      } else if (err instanceof AccountError && err.kind === 'offline') {
        setFailure("We couldn't reach MS Companion. Check your internet connection and try again.");
      } else {
        setFailure('Your account was not created. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      topBar={<StepHeader step={2} total={SETUP_STEPS} onBack={() => navigation.goBack()} />}
      title="Create your account"
      subtitle="Your account keeps your record safe if you change or lose your phone."
      footer={
        <>
          <Button label={busy ? 'Creating account…' : 'Create account'} onPress={onCreate} disabled={busy} />
          <Button label="I already have an account" variant="plain" onPress={() => navigation.navigate('Login')} />
        </>
      }
    >
      {failure ? <ErrorNote>{failure}</ErrorNote> : null}
      <Section variant="plain">
        <TextField
          label="First name"
          icon="user"
          placeholder="For example: Elena"
          value={firstName}
          onChangeText={(t) => {
            setFirstName(t);
            clear('firstName');
          }}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          error={errors.firstName}
        />
        <TextField
          label="Last name"
          icon="user"
          placeholder="For example: Georgiou"
          value={lastName}
          onChangeText={(t) => {
            setLastName(t);
            clear('lastName');
          }}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          error={errors.lastName}
        />
        <TextField
          label="Email"
          icon="mail"
          placeholder="name@example.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clear('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <PasswordField
          kind="new"
          label="Password"
          placeholder="Choose a password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clear('password');
          }}
          error={errors.password}
        />
        <PasswordField
          kind="new"
          label="Repeat password"
          placeholder="Type it again"
          value={confirm}
          onChangeText={(t) => {
            setConfirm(t);
            clear('confirm');
          }}
          error={errors.confirm}
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
      <Note>Your health data is never shared without your permission.</Note>
    </Screen>
  );
}
