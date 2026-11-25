import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { space } from '@/constants/design-tokens';
import { makeStyles, useColors } from '@/hooks/use-colors';
import { AppText } from '@/components/ui/app-text';
import { Row } from '@/components/ui/row';

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

function toWebDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toWebTimeValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function PickerRow({ label, mode, value, display, onChange, error }: Props) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const initial = value ?? defaultValue(mode);

  const onPress = () => {
    if (Platform.OS === 'android') {
      setOpen(true);
    } else {
      setOpen((o) => !o);
      if (!value) onChange(initial);
    }
  };

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'set' && date) {
      onChange(date);
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
          <AppText
            variant="label"
            color={display ? colors.accent : colors.secondary}
            style={styles.value}>
            {display ?? 'Choose'}
          </AppText>
        }
      />
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={initial} mode={mode} is24Hour onChange={handleAndroidChange} />
      ) : null}
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
      {open && Platform.OS === 'web' ? (
        <View style={styles.webInline}>
          {React.createElement('input', {
            type: mode,
            value: mode === 'date' ? toWebDateValue(initial) : toWebTimeValue(initial),
            onChange: (e: any) => {
              const raw: string = e.target?.value;
              if (!raw) return;
              if (mode === 'date') {
                const [y, m, d] = raw.split('-').map(Number);
                if (y && m && d) onChange(new Date(y, m - 1, d, 12));
              } else {
                const [h, min] = raw.split(':').map(Number);
                if (!Number.isNaN(h) && !Number.isNaN(min)) {
                  const next = new Date(initial);
                  next.setHours(h, min, 0, 0);
                  onChange(next);
                }
              }
            },
            style: {
              fontSize: 16,
              padding: 10,
              borderRadius: 8,
              border: `1px solid ${colors.inputBorder}`,
              color: colors.ink,
              backgroundColor: colors.page,
              width: '100%',
            },
          })}
        </View>
      ) : null}
      {error ? (
        <AppText
          variant="footnote"
          color={colors.destructive}
          style={styles.error}
          accessibilityLiveRegion="polite">
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

const useStyles = makeStyles((colors) => ({
  value: { fontWeight: '700' },
  inline: { backgroundColor: colors.surface, paddingHorizontal: space.sm },
  webInline: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  error: { paddingHorizontal: space.lg, paddingBottom: space.md, backgroundColor: colors.surface },
}));
