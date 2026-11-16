import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../theme/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

const TABS: Record<string, { label: string; icon: IconName }> = {
  Today: { label: 'Today', icon: 'home' },
  ProfileTab: { label: 'Profile', icon: 'user' },
  Settings: { label: 'Settings', icon: 'settings' },
};

// Bottom bar with the three main places of the app. The active tab gets a soft pill.
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name];
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            style={styles.tab}
          >
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Icon name={tab.icon} size={24} color={focused ? colors.accent : colors.secondary} />
            </View>
            <AppText
              variant="footnote"
              color={focused ? colors.accent : colors.secondary}
              // Fixed size: the bar must fit on small phones even at the largest text setting.
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
