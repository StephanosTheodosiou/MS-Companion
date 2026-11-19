import {
  TabList,
  type TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

/** Web version of the tab bar (native tabs are iOS/Android only). Keep in sync with app-tabs.tsx. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="tests" href="/tests" asChild>
            <TabButton>Tests</TabButton>
          </TabTrigger>
          <TabTrigger name="visit" href="/visit" asChild>
            <TabButton>Visit</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      // expo-router/ui types `ref` as Ref<View>, which doesn't match Pressable's ref type in RN 0.88.
      ref={ref as ComponentProps<typeof Pressable>['ref']}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={isFocused ? 'primarySoft' : 'surface'} style={styles.tabButtonView}>
        <ThemedText type="calloutStrong" themeColor={isFocused ? 'primary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="surface" style={styles.innerContainer}>
        <ThemedText type="calloutStrong" style={styles.brandText}>
          MS Companion
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
