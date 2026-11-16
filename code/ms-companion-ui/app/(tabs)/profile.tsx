import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import { g } from '@/styles/global';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <ThemedView style={g.screen}>
      <SafeAreaView style={g.screen} edges={['top']}>
        <ScrollView contentContainerStyle={[g.content, g.tabContent]}>
          <ThemedText type="title" accessibilityRole="header">
            Profile
          </ThemedText>

          {user ? (
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="headline">
                {user.firstName} {user.lastName}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{user.email}</ThemedText>
            </View>
          ) : null}

          {/* Navigation back to login happens automatically (protected routes in app/_layout.tsx). */}
          <Button title="Log out" variant="secondary" onPress={signOut} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
