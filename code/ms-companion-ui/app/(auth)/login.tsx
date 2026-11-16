import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { AppLogo } from '@/components/brand/app-logo';
import { FormScreen } from '@/components/layout/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useForm } from '@/hooks/use-form';
import { ApiError } from '@/utils/apiClient';
import { getErrorMessage } from '@/utils/errorMessages';
import { validateEmail, validateLoginPassword } from '@/utils/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const form = useForm(
    { email: '', password: '' },
    { email: validateEmail, password: validateLoginPassword },
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  async function handleSubmit() {
    if (submitting) return;
    setFormError(undefined);
    if (!form.validateAll()) return;

    setSubmitting(true);
    try {
      await signIn({ email: form.values.email.trim(), password: form.values.password });
      // No navigation here: the auth guard in app/_layout.tsx switches to the signed-in screens.
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.status === 401) {
        setFormError('The email or password is incorrect.');
      } else if (!(error instanceof ApiError && form.setFieldErrors(error.fieldErrors))) {
        setFormError(getErrorMessage(error));
      }
    }
  }

  return (
    <FormScreen
      footer={
        <View style={styles.switchRow}>
          <ThemedText type="callout" themeColor="textSecondary">
            New to MS Companion?
          </ThemedText>
          <Button
            variant="ghost"
            title="Create an account"
            onPress={() => router.push('/register')}
            disabled={submitting}
          />
        </View>
      }>
      <View style={styles.header}>
        <AppLogo />
        <View style={styles.headings}>
          <ThemedText type="display" accessibilityRole="header">
            Welcome back
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Log in to record how you feel and get ready for your next MS appointment.
          </ThemedText>
        </View>
      </View>

      {formError ? <Callout tone="danger" message={formError} /> : null}

      <View style={styles.fields}>
        <TextField
          label="Email"
          leadingIcon="mail"
          placeholder="name@example.com"
          value={form.values.email}
          onChangeText={(value) => form.setValue('email', value)}
          onBlur={() => form.handleBlur('email')}
          error={form.errors.email}
          editable={!submitting}
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
          placeholder="Your password"
          value={form.values.password}
          onChangeText={(value) => form.setValue('password', value)}
          onBlur={() => form.handleBlur('password')}
          error={form.errors.password}
          editable={!submitting}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Button title="Log in" loading={submitting} onPress={handleSubmit} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.four,
    paddingTop: Spacing.three,
  },
  headings: {
    gap: Spacing.two,
  },
  fields: {
    gap: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
