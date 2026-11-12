import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, radius } from '../theme/theme';
import { AppText } from './AppText';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, selected, onSelect }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isSelected }}
            style={[styles.segment, isSelected && styles.selected]}
          >
            <AppText
              variant={isSelected ? 'label' : 'body'}
              color={isSelected ? colors.ink : colors.secondary}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: radius.control,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control - 2,
    paddingHorizontal: 6,
  },
  selected: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.inputBorder,
  },
});
