import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Note } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TopBar } from '@/components/layout/top-bar';
import { sortTimes } from '@/constants/medication';
import { getConsents, listMedications, listSideEffects } from '@/utils/storage';
import { Medication, SideEffect } from '@/types/health';
import { formatShortDate, todayKey } from '@/utils/date';

export default function MedicationsScreen() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);

  const load = useCallback(async () => {
    try {
      const [consents, meds, effects] = await Promise.all([
        getConsents(),
        listMedications(),
        listSideEffects(),
      ]);
      setAllowed(consents.medication);
      setMedications(meds);
      setSideEffects(effects);
    } catch (e) {
      console.warn('Could not load medication', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const topBar = <TopBar onBack={() => router.back()} />;

  if (allowed === false) {
    return (
      <Screen
        topBar={topBar}
        title="My medicines"
        subtitle="You chose not to let the app store your medication."
        footer={<Button label="Open Profile" onPress={() => router.navigate('/profile')} />}>
        <Note icon="info">
          To track doses and get reminders, turn on Medication under “What the app may use” in
          Profile.
        </Note>
      </Screen>
    );
  }

  const medName = (id: string) => medications.find((m) => m.id === id)?.name ?? 'Removed medicine';

  return (
    <Screen
      topBar={topBar}
      title="My medicines"
      subtitle="Tick off each dose on Home. Change a medicine or its times here.">
      <Section
        header="Medicines"
        iconInset
        footer={medications.length === 0 ? 'Add the medicines you take for your MS.' : undefined}>
        {medications.map((m) => (
          <Row
            key={m.id}
            icon="plus-square"
            strong
            label={m.name}
            description={[m.dose, sortTimes(m.times).join(', ')].filter(Boolean).join(' · ')}
            chevron
            onPress={() => router.push({ pathname: '/medication-edit', params: { id: m.id } })}
          />
        ))}
        <Row
          icon="plus"
          label="Add a medicine"
          chevron
          onPress={() => router.push('/medication-edit')}
        />
      </Section>

      {medications.length > 0 ? (
        <Section header="Side effects" iconInset footer="These are added to your visit summary.">
          {sideEffects.slice(0, 3).map((s) => (
            <Row
              key={s.id}
              icon="alert-circle"
              label={s.description}
              description={`${medName(s.medicationId)} · ${formatShortDate(todayKey(new Date(s.loggedAt)))}`}
            />
          ))}
          <Row
            icon="edit-3"
            label="Note a side effect"
            chevron
            onPress={() => router.push('/side-effect')}
          />
        </Section>
      ) : null}
    </Screen>
  );
}
