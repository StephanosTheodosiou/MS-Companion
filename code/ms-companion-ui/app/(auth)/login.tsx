import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { g } from '@/styles/global';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleSignIn() {
    // TODO: call the auth endpoint via `api.post(...)`, then `saveToken(response.token)`.
    router.replace('/home');
  }

  return (
    <ThemedView style={g.screen}>
      <SafeAreaView style={g.screen}>
        <KeyboardAvoidingView
          style={[g.content, g.center]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">MS Companion</ThemedText>
            <ThemedText themeColor="textSecondary">Sign in to continue</ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={canSubmit ? handleSignIn : undefined}
            />
            <Button title="Sign in" onPress={handleSignIn} disabled={!canSubmit} />
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
});
