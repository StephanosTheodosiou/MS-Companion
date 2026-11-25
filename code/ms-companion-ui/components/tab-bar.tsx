import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href, type Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { AppText } from '@/components/ui/app-text';
import { Icon, IconName } from '@/components/ui/app-icon';

/** The props expo-router's <Tabs> passes to a custom tab bar. */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  tests: { label: 'Tests', icon: 'clipboard' },
  visit: { label: 'Visit', icon: 'file-text' },
  profile: { label: 'Profile', icon: 'user' },
};

export function TabBar({ state }: TabBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
      accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        // A tab file without an entry in TABS still gets a button instead of crashing the bar.
        const tab = TABS[route.name] ?? { label: route.name, icon: 'circle' as IconName };
        const onPress = () => {
          if (!focused) router.navigate(`/${route.name}` as Href);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            style={styles.tab}>
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Icon name={tab.icon} size={24} color={focused ? colors.accent : colors.secondary} />
            </View>
            <AppText
              variant="footnote"
              color={focused ? colors.accent : colors.secondary}
              // Fixed size: the bar must fit on small phones even at the largest text setting.
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.separator,
    paddingTop: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 56 },
  pill: { width: 64, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: colors.accentSoft },
  label: { fontSize: 13, lineHeight: 17 },
  labelActive: { fontWeight: '700' },
}));
