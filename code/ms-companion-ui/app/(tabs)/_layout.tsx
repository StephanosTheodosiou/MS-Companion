import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';
import { colors } from '@/constants/design-tokens';

/**
 * Bottom tabs: Today, Profile, Tests, Visit and Settings, with the app's own tab bar (components/tab-bar.tsx).
 * To add a tab: create `app/(tabs)/<name>.tsx`, add a <Tabs.Screen> here and a label and icon in TABS in tab-bar.tsx.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.page } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="tests" />
      <Tabs.Screen name="visit" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
