import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { g } from '@/styles/global';

export default function HomeScreen() {
  return (
    <ThemedView style={g.screen}>
      <SafeAreaView style={g.screen} edges={['top']}>
        <ScrollView contentContainerStyle={[g.content, g.tabContent]}>
          <ThemedText type="subtitle">Home</ThemedText>
          <ThemedText themeColor="textSecondary">Welcome to MS Companion.</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
