import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TopBar } from '@/components/layout/top-bar';
import { listSymptomEntries } from '@/utils/storage';
import { SymptomEntry } from '@/types/health';
import { formatShortDate } from '@/utils/date';

// E3 / US-01: every new or worse symptom the person logged, newest first.
export default function SymptomLogScreen() {
  const router = useRouter();
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
      topBar={<TopBar onBack={() => router.back()} />}
      title="Symptom log"
      subtitle="New or worse symptoms you logged. They are added to your next visit summary."
      footer={<Button label="Log a new or worse symptom" onPress={() => router.push('/symptom-entry')} />}
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
