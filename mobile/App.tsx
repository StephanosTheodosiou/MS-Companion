import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getSession, getTextSize, hasCompletedOnboarding } from './src/services/storage';
import { AppNavigator, StartRoute } from './src/navigation/AppNavigator';
import { colors } from './src/theme/theme';
import { TextSizeProvider } from './src/theme/TextSizeContext';
import { TextSize } from './src/types';

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<StartRoute>('Welcome');
  const [textSize, setTextSize] = useState<TextSize>('normal');

  // Load saved settings once and decide where to start:
  // logged in and set up -> Today; logged in but setup not finished -> consent;
  // logged out after setting up -> Log in; first launch -> Welcome.
  useEffect(() => {
    (async () => {
      try {
        const [done, session, size] = await Promise.all([hasCompletedOnboarding(), getSession(), getTextSize()]);
        setInitialRoute(session ? (done ? 'Home' : 'Consent') : done ? 'Login' : 'Welcome');
        setTextSize(size);
      } catch (e) {
        console.warn('Could not load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TextSizeProvider initialSize={textSize}>
        <NavigationContainer>
          <AppNavigator initialRoute={initialRoute} />
        </NavigationContainer>
        <StatusBar style="dark" />
      </TextSizeProvider>
    </SafeAreaProvider>
  );
}
