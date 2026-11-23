import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { FormScreen } from '@/components/layout/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { IconButton } from '@/components/ui/icon-button';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useForm } from '@/hooks/use-form';
import { ApiError } from '@/utils/apiClient';
import { getErrorMessage } from '@/utils/errorMessages';
import { AuthLimits, validateEmail, validateName, validateNewPassword } from '@/utils/validation';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const lastNameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const form = useForm(
    { firstName: '', lastName: '', email: '', password: '' },
    {
      firstName: validateName('first name'),
      lastName: validateName('last name'),
      email: validateEmail,
      password: validateNewPassword,
    },
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  async function handleSubmit() {
    if (submitting) return;
    setFormError(undefined);
    if (!form.validateAll()) return;

    const { firstName, lastName, email, password } = form.values;
    setSubmitting(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      // No navigation here: the auth guard in app/_layout.tsx switches to the signed-in screens.
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.status === 409) {
        form.setFieldErrors({
          email: 'An account with this email already exists. Log in instead.',
        });
      } else if (!(error instanceof ApiError && form.setFieldErrors(error.fieldErrors))) {
        setFormError(getErrorMessage(error));
      }
    }
  }

  function goToLogin() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  }

  return (
    <FormScreen
      footer={
        <View style={styles.switchRow}>
          <ThemedText type="callout" themeColor="textSecondary">
            Already have an account?
          </ThemedText>
          <Button variant="ghost" title="Log in" onPress={goToLogin} disabled={submitting} />
        </View>
      }>
      <View style={styles.header}>
        <IconButton
          icon="back"
          accessibilityLabel="Back to log in"
          onPress={goToLogin}
          disabled={submitting}
        />
        <View style={styles.headings}>
          <ThemedText type="display" accessibilityRole="header">
            Create your account
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Next, you&apos;ll choose what the app may store. You can change this at any time.
          </ThemedText>
        </View>
      </View>

      {formError ? <Callout tone="danger" message={formError} /> : null}

      <View style={styles.fields}>
        <View style={styles.nameRow}>
          <TextField
            containerStyle={styles.nameField}
            label="First name"
            value={form.values.firstName}
            onChangeText={(value) => form.setValue('firstName', value)}
            onBlur={() => form.handleBlur('firstName')}
            error={form.errors.firstName}
            editable={!submitting}
            maxLength={AuthLimits.nameMax}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
          <TextField
            ref={lastNameRef}
            containerStyle={styles.nameField}
            label="Last name"
            value={form.values.lastName}
            onChangeText={(value) => form.setValue('lastName', value)}
            onBlur={() => form.handleBlur('lastName')}
            error={form.errors.lastName}
            editable={!submitting}
            maxLength={AuthLimits.nameMax}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>

        <TextField
          ref={emailRef}
          label="Email"
          leadingIcon="mail"
          placeholder="name@example.com"
          value={form.values.email}
          onChangeText={(value) => form.setValue('email', value)}
          onBlur={() => form.handleBlur('email')}
          error={form.errors.email}
          editable={!submitting}
          maxLength={AuthLimits.emailMax}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <PasswordField
          ref={passwordRef}
          label="Password"
          placeholder="Create a password"
          hint={`At least ${AuthLimits.passwordMin} characters.`}
          value={form.values.password}
          onChangeText={(value) => form.setValue('password', value)}
          onBlur={() => form.handleBlur('password')}
          error={form.errors.password}
          editable={!submitting}
          maxLength={AuthLimits.passwordMax}
          autoComplete="new-password"
          textContentType="newPassword"
          passwordRules={`minlength: ${AuthLimits.passwordMin};`}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Button title="Create account" loading={submitting} onPress={handleSubmit} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.four,
  },
  headings: {
    gap: Spacing.two,
  },
  fields: {
    gap: Spacing.three,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
