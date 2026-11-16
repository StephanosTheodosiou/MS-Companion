import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, space } from '../theme/theme';
import { AppText } from './AppText';
import { Row } from './Row';

interface Props {
  label: string;
  mode: 'date' | 'time';
  /** The chosen value, or null if nothing is chosen yet. */
  value: Date | null;
  /** Text for the chosen value, e.g. "Tue 17 Nov 2026" or "10:30". */
  display: string | null;
  onChange: (value: Date) => void;
  error?: string | null;
}

// A row that opens the phone's own calendar or clock.
// Android: the system pop-up. iPhone: the picker opens below the row.
export function PickerRow({ label, mode, value, display, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const initial = value ?? defaultValue(mode);

  const onPress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode,
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setOpen((o) => !o);
      if (!value) onChange(initial);
    }
  };

  return (
    <View>
      <Row
        icon={mode === 'date' ? 'calendar' : 'clock'}
        label={label}
        onPress={onPress}
        accessibilityLabel={`${label}, ${display ?? 'not chosen'}`}
        accessibilityHint={mode === 'date' ? 'Opens the calendar' : 'Opens the clock'}
        accessory={
          <AppText variant="label" color={display ? colors.accent : colors.secondary} style={styles.value}>
            {display ?? 'Choose'}
          </AppText>
        }
      />
      {open && Platform.OS === 'ios' ? (
        <View style={styles.inline}>
          <DateTimePicker
            value={initial}
            mode={mode}
            display={mode === 'date' ? 'inline' : 'spinner'}
            accentColor={colors.accent}
            minuteInterval={5}
            onChange={(_e: DateTimePickerEvent, date?: Date) => {
              if (date) onChange(date);
            }}
          />
        </View>
      ) : null}
      {error ? (
        <AppText variant="footnote" color={colors.destructive} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function defaultValue(mode: 'date' | 'time'): Date {
  const d = new Date();
  if (mode === 'time') d.setHours(10, 0, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  value: { fontWeight: '700' },
  inline: { backgroundColor: colors.surface, paddingHorizontal: space.sm },
  error: { paddingHorizontal: space.lg, paddingBottom: space.md, backgroundColor: colors.surface },
});
