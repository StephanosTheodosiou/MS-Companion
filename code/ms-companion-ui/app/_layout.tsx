import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { TextSizeProvider } from '@/context/text-size-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <TextSizeProvider>
        <RootNavigator />
      </TextSizeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { status } = useAuth();
  const isSignedIn = status === 'signedIn';

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hide();
    }
  }, [status]);

  return (
    <ThemeProvider value={NavigationThemes[scheme]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          {/* E1 first-time setup: consent per data type, then the profile. */}
          <Stack.Screen name="(onboarding)" />
          {/* Full-screen pages opened from the tabs. Each draws its own back button. */}
          <Stack.Screen name="check-in" />
          <Stack.Screen name="medications" />
          <Stack.Screen name="medication-edit" />
          <Stack.Screen name="side-effect" />
          <Stack.Screen name="blood-tests" />
          <Stack.Screen name="blood-test-edit" />
          <Stack.Screen name="symptom-log" />
          <Stack.Screen name="symptom-entry" />
          <Stack.Screen name="appointments" />
          <Stack.Screen name="appointment-edit" />
          <Stack.Screen name="questions" />
          <Stack.Screen name="visit-summary" />
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

const NavigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.background,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.danger,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
      notification: Colors.dark.danger,
    },
  },
};
