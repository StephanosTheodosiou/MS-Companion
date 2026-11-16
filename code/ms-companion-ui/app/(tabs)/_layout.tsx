import AppTabs from '@/components/app-tabs';

/**
 * Bottom-tab navigator. The tab bar lives in `components/app-tabs.tsx` (native tabs on
 * iOS/Android) and `components/app-tabs.web.tsx` (custom tab bar on web).
 * To add a tab: create `app/(tabs)/<name>.tsx` and add a trigger in both files.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
