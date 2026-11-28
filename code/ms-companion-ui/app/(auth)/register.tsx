import React, { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { ErrorNote, Note } from '@/components/ui/notice';
import { PasswordField } from '@/components/ui/app-password-field';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { StepHeader } from '@/components/layout/step-header';
import { SETUP_STEPS } from '@/constants/onboarding';
import { TextField } from '@/components/ui/app-text-field';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/utils/apiClient';
import { AuthLimits, validateEmail, validateName, validateNewPassword } from '@/utils/validation';

type Field = 'firstName' | 'lastName' | 'email' | 'password' | 'confirm';

// E1, step 2 of 4: create an account, in the Figma design (the login screen keeps the earlier style).
// The fields match the API's RegisterRequest; signing up goes through useAuth().signUp.
export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastNameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const clear = (field: Field) => setErrors((e) => (e[field] ? { ...e, [field]: null } : e));

  const back = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));

  const onCreate = async () => {
    if (busy) return;
    const p = validateNewPassword(password) ?? null;
    const next: Partial<Record<Field, string | null>> = {
      firstName: validateName('first name')(firstName) ?? null,
      lastName: validateName('last name')(lastName) ?? null,
      email: validateEmail(email) ?? null,
      password: p,
      confirm: !p && confirm !== password ? 'The two passwords are not the same.' : null,
    };
    setErrors(next);
    setFailure(null);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      // No navigation here: the auth guard switches screens and app/index.tsx opens consent (step 3).
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'An account with this email already exists. Log in instead.' });
      } else if (
        err instanceof ApiError &&
        err.status === 400 &&
        Object.keys(err.fieldErrors).length > 0
      ) {
        // The server checks the same fields; show its messages under the matching field.
        setErrors({ ...err.fieldErrors });
      } else if (err instanceof ApiError && err.isNetworkError) {
        setFailure("We couldn't reach MS Companion. Check your internet connection and try again.");
      } else {
        setFailure('Your account was not created. Please try again.');
      }
    }
  };

  return (
    <Screen
      topBar={<StepHeader step={SETUP_STEPS.createAccount} total={SETUP_STEPS.total} onBack={back} />}
      title="Create your account"
      subtitle="Your account keeps your record safe if you change or lose your phone."
      footer={
        <>
          <Button
            label={busy ? 'Creating account…' : 'Create account'}
            onPress={onCreate}
            disabled={busy}
          />
          <Button
            label="I already have an account"
            variant="plain"
            onPress={() => router.dismissTo('/login')}
          />
        </>
      }>
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
          maxLength={AuthLimits.nameMax}
          textContentType="givenName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => lastNameRef.current?.focus()}
          error={errors.firstName}
        />
        <TextField
          ref={lastNameRef}
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
          maxLength={AuthLimits.nameMax}
          textContentType="familyName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={errors.lastName}
        />
        <TextField
          ref={emailRef}
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
          maxLength={AuthLimits.emailMax}
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          kind="new"
          maxLength={AuthLimits.passwordMax}
          label="Password"
          placeholder="Choose a password"
          hint={`At least ${AuthLimits.passwordMin} characters.`}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clear('password');
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.password}
        />
        <PasswordField
          ref={confirmRef}
          kind="new"
          maxLength={AuthLimits.passwordMax}
          label="Repeat password"
          placeholder="Type it again"
          value={confirm}
          onChangeText={(t) => {
            setConfirm(t);
            clear('confirm');
          }}
          returnKeyType="go"
          onSubmitEditing={onCreate}
          error={errors.confirm}
        />
      </Section>
      <Note>Your health data is never shared without your permission.</Note>
    </Screen>
  );
}
