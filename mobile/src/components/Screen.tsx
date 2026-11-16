import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme/theme';
import { AppText } from './AppText';

export type ScrollViewRef = React.ComponentRef<typeof ScrollView>;

interface Props {
  title?: string;
  subtitle?: string;
  /** Small uppercase text above the title, e.g. today's date. */
  overline?: string;
  /** Shown above the title, e.g. the app icon on the Welcome screen. */
  header?: React.ReactNode;
  /** Shown on the right of the title, e.g. a round icon button. */
  titleAccessory?: React.ReactNode;
  /** Fixed bar at the top, e.g. the back button and step progress. */
  topBar?: React.ReactNode;
  /** Pinned below the scrolling content, for the screen's main action. */
  footer?: React.ReactNode;
  /** Tab screens sit above the tab bar, which already handles the bottom edge. */
  inTabs?: boolean;
  /** Lets a screen scroll programmatically, e.g. to show a form error. */
  scrollRef?: React.Ref<ScrollViewRef>;
  children: React.ReactNode;
}

// The app draws its own headers, so every screen handles the top safe area itself.
export function Screen({
  title,
  subtitle,
  overline,
  header,
  titleAccessory,
  topBar,
  footer,
  inTabs,
  scrollRef,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={inTabs ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {topBar ? <View style={styles.topBar}>{topBar}</View> : null}
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.content, !topBar && styles.contentNoBar]}
          keyboardShouldPersistTaps="handled"
        >
          {title ? (
            <View style={styles.titleBlock}>
              {header}
              <View style={styles.titleRow}>
                <View style={styles.flex}>
                  {overline ? <AppText variant="overline">{overline}</AppText> : null}
                  <AppText variant="largeTitle" accessibilityRole="header">
                    {title}
                  </AppText>
                </View>
                {titleAccessory}
              </View>
              {subtitle ? <AppText color={colors.secondary}>{subtitle}</AppText> : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md },
  content: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.xxl, gap: space.xxl },
  contentNoBar: { paddingTop: space.xxl },
  titleBlock: { gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.md, gap: space.xs },
});
