import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme/theme';
import { AppText } from './AppText';
import { Card } from './Card';
import { Icon } from './Icon';

export interface WeekDay {
  /** YYYY-MM-DD */
  date: string;
  dayOfMonth: number;
  /** "M", "T", ... */
  letter: string;
  /** "Monday", for screen readers. */
  name: string;
  isToday: boolean;
  isFuture: boolean;
  checkedIn: boolean;
}

// Monday to Sunday of this week: a filled tick for days with a check-in, a ring for today.
export function WeekStrip({ days }: { days: WeekDay[] }) {
  const done = days.filter((d) => d.checkedIn).length;
  return (
    <Card style={styles.card}>
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`This week: ${done} of 7 days checked in. ${days
          .filter((d) => !d.isFuture)
          .map((d) => `${d.name}${d.isToday ? ' (today)' : ''}: ${d.checkedIn ? 'checked in' : 'no check-in'}`)
          .join('. ')}`}
      >
        {days.map((d) => (
          <View key={d.date} style={styles.day}>
            <AppText
              variant="label"
              color={d.isToday ? colors.accent : colors.secondary}
              style={d.isToday ? styles.todayLetter : undefined}
            >
              {d.letter}
            </AppText>
            <View
              style={[
                styles.circle,
                d.checkedIn ? styles.done : d.isToday ? styles.today : styles.other,
              ]}
            >
              {d.checkedIn ? (
                <Icon name="check" size={20} color={colors.onAccent} />
              ) : (
                <AppText
                  variant="label"
                  color={d.isToday ? colors.accent : colors.secondary}
                  style={d.isToday ? styles.todayLetter : styles.otherNumber}
                >
                  {d.dayOfMonth}
                </AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: space.lg, paddingHorizontal: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, alignItems: 'center', gap: space.md },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: colors.accent },
  today: { backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: colors.accent },
  other: { backgroundColor: colors.muted },
  todayLetter: { fontWeight: '800' },
  otherNumber: { fontWeight: '500' },
});
