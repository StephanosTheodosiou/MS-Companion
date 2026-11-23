import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/constants/design-tokens';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/app-icon';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Extra text on the right, e.g. a time. */
  detail?: string;
}

interface Props<T extends string> {
  header?: string;
  options: Option<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}

// Single choice as separate cards, with a radio circle on the right (e.g. type of MS).
export function ChoiceCards<T extends string>({ header, options, selected, onSelect }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {header ? (
        <AppText variant="overline" accessibilityRole="header" style={styles.header}>
          {header}
        </AppText>
      ) : null}
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isSelected }}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <AppText
              variant="label"
              color={isSelected ? colors.accent : colors.ink}
              style={styles.label}
            >
              {option.label}
            </AppText>
            {option.detail ? <AppText color={colors.secondary}>{option.detail}</AppText> : null}
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <Icon name="check" size={16} color={colors.onAccent} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  header: { paddingHorizontal: space.xs, marginBottom: space.xs },
  card: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft, ...shadow, shadowOpacity: 0 },
  label: { flex: 1, fontWeight: '600' },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  box: { borderRadius: 7 },
});

interface CheckProps<T extends string> {
  header?: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}

// Several choices as separate cards with a tick box (e.g. the times a medicine is taken).
export function CheckCards<T extends string>({ header, options, selected, onToggle }: CheckProps<T>) {
  return (
    <View style={styles.wrap}>
      {header ? (
        <AppText variant="overline" accessibilityRole="header" style={styles.header}>
          {header}
        </AppText>
      ) : null}
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityLabel={[option.label, option.detail].filter(Boolean).join(', ')}
            accessibilityState={{ checked: isSelected }}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <AppText variant="label" color={isSelected ? colors.accent : colors.ink} style={styles.label}>
              {option.label}
            </AppText>
            {option.detail ? <AppText color={colors.secondary}>{option.detail}</AppText> : null}
            <View style={[styles.radio, styles.box, isSelected && styles.radioSelected]}>
              {isSelected ? <Icon name="check" size={16} color={colors.onAccent} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
