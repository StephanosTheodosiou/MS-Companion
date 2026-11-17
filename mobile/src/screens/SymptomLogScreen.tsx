import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TopBar } from '../components/TopBar';
import { StackProps } from '../navigation/types';
import { listSymptomEntries } from '../services/storage';
import { SymptomEntry } from '../types';
import { formatShortDate } from '../utils/date';

// E3 / US-01: every new or worse symptom the person logged, newest first.
export function SymptomLogScreen({ navigation }: StackProps<'SymptomLog'>) {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSymptomEntries()
        .then(setEntries)
        .catch((e) => console.warn('Could not load symptom log', e));
    }, [])
  );

  return (
    <Screen
      topBar={<TopBar onBack={() => navigation.goBack()} />}
      title="Symptom log"
      subtitle="New or worse symptoms you logged. They are added to your next visit summary."
      footer={<Button label="Log a new or worse symptom" onPress={() => navigation.navigate('SymptomEntry')} />}
    >
      <Section iconInset footer={entries.length === 0 ? 'Nothing logged yet.' : undefined}>
        {entries.map((entry) => (
          <Row
            key={entry.id}
            icon="activity"
            strong
            label={entry.description}
            description={[
              `Started ${formatShortDate(entry.startedOn)}`,
              entry.lastedOver24h ? 'over 24 hours' : null,
              entry.syncStatus === 'waiting' ? 'Waiting to sync' : 'Synced',
            ]
              .filter(Boolean)
              .join(' · ')}
          />
        ))}
      </Section>
    </Screen>
  );
}
