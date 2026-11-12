import React from 'react';
import { AppText } from './AppText';
import { Row } from './Row';
import { Section } from './Section';
import { colors } from '../theme/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  header?: string;
  footer?: string;
  options: Option<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}

// A single-choice list with a check mark on the chosen row.
export function OptionGroup<T extends string>({ header, footer, options, selected, onSelect }: Props<T>) {
  return (
    <Section header={header} footer={footer}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Row
            key={option.value}
            label={option.label}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessory={
              isSelected ? (
                <AppText color={colors.accent} style={{ fontWeight: '600' }}>
                  ✓
                </AppText>
              ) : null
            }
          />
        );
      })}
    </Section>
  );
}
