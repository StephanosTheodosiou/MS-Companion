import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { Screen } from '@/components/layout/screen';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { addSideEffect, listMedications } from '@/utils/storage';
import { Medication } from '@/types/health';
import { newId } from '@/utils/id';

// E3: note a side effect so the neurologist sees it in the visit summary.
export default function SideEffectScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMedications()
      .then((meds) => {
        setMedications(meds);
        if (meds.length === 1) setMedicationId(meds[0].id);
      })
      .catch((e) => console.warn('Could not load medicines', e));
  }, []);

  const onSave = async () => {
    if (!medicationId || description.trim() === '') {
      setError(!medicationId ? 'Choose the medicine.' : 'Describe the side effect.');
      return;
    }
    try {
      await addSideEffect({ id: newId(), medicationId, description: description.trim(), loggedAt: new Date().toISOString() });
      router.back();
    } catch (e) {
      console.warn('Could not save side effect', e);
      Alert.alert('The side effect was not saved', 'Please try again.');
    }
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="Note a side effect"
      subtitle="Do not stop or change a medicine on your own. Talk to your doctor first."
      footer={<Button label="Save" onPress={onSave} />}
    >
      <ChoiceCards
        header="Which medicine?"
        options={medications.map((m) => ({ value: m.id, label: m.name }))}
        selected={medicationId}
        onSelect={(id) => {
          setMedicationId(id);
          setError(null);
        }}
      />
      <TextField
        label="What happened?"
        icon="edit-3"
        placeholder="For example: headache after the evening dose"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setError(null);
        }}
        multiline
        error={error}
      />
    </Screen>
  );
}
