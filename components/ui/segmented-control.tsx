import React from 'react';
import { Pressable, View } from 'react-native';
import { MIN_TOUCH, radius, shadow } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { AppText } from '@/components/ui/app-text';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, selected, onSelect }: Props<T>) {
  const styles = useStyles();
  const colors = useColors();
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
              variant="label"
              color={isSelected ? colors.onAccent : colors.secondary}
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

const useStyles = makeStyles((colors) => ({
  track: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.button, padding: 4, ...shadow },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button - 4,
    paddingHorizontal: 6,
  },
  selected: { backgroundColor: colors.accent },
}));
