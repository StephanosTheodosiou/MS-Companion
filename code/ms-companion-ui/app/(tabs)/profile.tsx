import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { g } from '@/styles/global';
import { clearToken } from '@/utils/authStorage';

export default function ProfileScreen() {
  async function handleSignOut() {
    await clearToken();
    router.replace('/login');
  }

  return (
    <ThemedView style={g.screen}>
      <SafeAreaView style={g.screen} edges={['top']}>
        <ScrollView contentContainerStyle={[g.content, g.tabContent]}>
          <ThemedText type="subtitle">Profile</ThemedText>
          <ThemedText themeColor="textSecondary">Account settings will live here.</ThemedText>
          <Button title="Sign out" variant="outline" onPress={handleSignOut} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
