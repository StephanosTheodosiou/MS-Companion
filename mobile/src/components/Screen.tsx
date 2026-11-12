import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme/theme';
import { AppText } from './AppText';

export type ScrollViewRef = React.ComponentRef<typeof ScrollView>;

interface Props {
  title?: string;
  subtitle?: string;
  /** Pinned below the scrolling content, for the screen's main action. */
  footer?: React.ReactNode;
  /** Screens without a navigation header need the top safe area. */
  noHeader?: boolean;
  /** Lets a screen scroll programmatically, e.g. to show a form error. */
  scrollRef?: React.Ref<ScrollViewRef>;
  children: React.ReactNode;
}

export function Screen({ title, subtitle, footer, noHeader, scrollRef, children }: Props) {
  const edges: Edge[] = noHeader ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom'];
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.content, noHeader && styles.contentNoHeader]}
          keyboardShouldPersistTaps="handled"
        >
          {title ? (
            <View style={styles.titleBlock}>
              <AppText variant="largeTitle" accessibilityRole="header">
                {title}
              </AppText>
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
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
    gap: space.xxl,
  },
  contentNoHeader: { paddingTop: space.xxl },
  titleBlock: { gap: space.sm },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.xs,
  },
});
