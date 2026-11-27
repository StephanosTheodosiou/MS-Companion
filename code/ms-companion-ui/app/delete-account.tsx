import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Icon } from '@/components/ui/app-icon';
import { TextField } from '@/components/ui/app-text-field';
import { ErrorNote, Note } from '@/components/ui/notice';
import { Screen } from '@/components/layout/screen';
import { TopBar } from '@/components/layout/top-bar';
import { useAuth } from '@/context/auth-context';
import { useTextSize } from '@/context/text-size-context';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/utils/apiClient';
import { authApi } from '@/utils/authApi';
import { getErrorMessage } from '@/utils/errorMessages';
import { deleteAllData } from '@/utils/storage';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signOut } = useAuth();
  const { setSize } = useTextSize();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await authApi.deleteAccount(password);
    } catch (e) {
      setDeleting(false);
      if (e instanceof ApiError && e.status === 403) {
        setFieldError('That password is not correct. Nothing was deleted.');
      } else if (!(e instanceof ApiError && e.status === 401)) {
        setError(getErrorMessage(e));
      }
      return;
    }
    try {
      await deleteAllData();
    } catch (e) {
      console.warn('Could not delete the data on this phone', e);
    }
    setSize('normal', { persist: false });
    await signOut();
  };

  const onDelete = () => {
    if (password === '') {
      setFieldError('Enter your password to confirm.');
      return;
    }
    Alert.alert(
      'Delete your account?',
      'Your account and all your health data will be deleted for good. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="Delete my account"
      subtitle="Your account and all your health data will be deleted from this phone and from the MS Companion server. This cannot be undone."
      footer={
        <Button
          label={deleting ? 'Deleting…' : 'Delete my account'}
          onPress={onDelete}
          disabled={deleting}
          accessibilityHint="Asks you to confirm"
        />
      }>
      <Note icon="download">
        Want a copy first? Go back and use Export my data before you delete.
      </Note>
      <TextField
        label="Password"
        icon="lock"
        hint="Enter your password to confirm it is you."
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (fieldError) setFieldError(null);
        }}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={onDelete}
        error={fieldError}
        trailing={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            <Icon name={visible ? 'eye-off' : 'eye'} size={20} color={colors.secondary} />
          </Pressable>
        }
      />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
    </Screen>
  );
}
