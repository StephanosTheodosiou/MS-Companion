import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';
import { useColors } from '@/hooks/use-colors';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.page } }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="tests" />
      <Tabs.Screen name="visit" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
