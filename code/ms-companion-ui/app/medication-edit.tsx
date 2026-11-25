import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { CheckCards } from '@/components/ui/choice-cards';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { DOSE_TIMES, sortTimes } from '@/constants/medication';
import { deleteMedication, getMedication, saveMedication } from '@/utils/storage';
import { useColors } from '@/hooks/use-colors';
import { DoseTime } from '@/types/health';
import { newId } from '@/utils/id';

// E3: add or edit a medicine and when it is taken.
export default function MedicationEditScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<DoseTime[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [timesError, setTimesError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    getMedication(editingId)
      .then((m) => {
        if (m) {
          setName(m.name);
          setDose(m.dose);
          setTimes(m.times);
        }
      })
      .catch((e) => console.warn('Could not load medicine', e));
  }, [editingId]);

  const toggleTime = (time: DoseTime) => {
    setTimes((current) =>
      current.includes(time) ? current.filter((t) => t !== time) : sortTimes([...current, time]),
    );
    setTimesError(false);
  };

  const onSave = async () => {
    const missingName = name.trim() === '';
    setNameError(missingName ? 'Enter the name of the medicine.' : null);
    setTimesError(times.length === 0);
    if (missingName || times.length === 0) return;
    setSaving(true);
    try {
      await saveMedication({
        id: editingId ?? newId(),
        name: name.trim(),
        dose: dose.trim(),
        times,
      });
      router.back();
    } catch (e) {
      console.warn('Could not save medicine', e);
      Alert.alert('The medicine was not saved', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert('Remove this medicine?', 'Doses you already logged stay in your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMedication(editingId);
            router.back();
          } catch (e) {
            console.warn('Could not remove medicine', e);
          }
        },
      },
    ]);
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title={editingId ? 'Edit medicine' : 'Add a medicine'}
      footer={<Button label="Save" onPress={onSave} disabled={saving} />}>
      <Section variant="plain">
        <TextField
          label="Name"
          icon="plus-square"
          placeholder="For example: Fingolimod"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError(null);
          }}
          autoCapitalize="words"
          error={nameError}
        />
        <TextField
          label="Dose"
          icon="info"
          placeholder="For example: 500 mg, 1 tablet"
          hint="Optional."
          value={dose}
          onChangeText={setDose}
        />
      </Section>

      <CheckCards
        header="When do you take it?"
        options={DOSE_TIMES.map((t) => ({ value: t.value, label: t.label, detail: t.value }))}
        selected={times}
        onToggle={toggleTime}
      />
      {timesError ? (
        <AppText variant="footnote" color={colors.destructive} accessibilityLiveRegion="polite">
          Choose at least one time.
        </AppText>
      ) : (
        <AppText variant="footnote">Choose one or more. Reminders will use these times.</AppText>
      )}

      {editingId ? (
        <Section iconInset>
          <Row icon="trash-2" label="Remove this medicine" destructive onPress={onDelete} />
        </Section>
      ) : null}
    </Screen>
  );
}
