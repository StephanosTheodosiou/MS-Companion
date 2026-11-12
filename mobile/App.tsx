import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getTextSize, hasCompletedOnboarding } from './src/services/storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/theme';
import { TextSizeProvider } from './src/theme/TextSizeContext';
import { TextSize } from './src/types';

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Welcome' | 'Home'>('Welcome');
  const [textSize, setTextSize] = useState<TextSize>('normal');

  // Load saved settings once and decide where to start:
  // first launch -> Welcome, otherwise -> Home.
  useEffect(() => {
    (async () => {
      try {
        const [done, size] = await Promise.all([hasCompletedOnboarding(), getTextSize()]);
        setInitialRoute(done ? 'Home' : 'Welcome');
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
