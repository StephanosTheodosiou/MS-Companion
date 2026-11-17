import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '../components/Button';
import { ChoiceCards } from '../components/ChoiceCards';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { StackProps } from '../navigation/types';
import { addSideEffect, listMedications } from '../services/storage';
import { Medication } from '../types';
import { newId } from '../utils/id';

// E3: note a side effect so the neurologist sees it in the visit summary.
export function SideEffectScreen({ navigation }: StackProps<'SideEffect'>) {
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
      navigation.goBack();
    } catch (e) {
      console.warn('Could not save side effect', e);
      Alert.alert('The side effect was not saved', 'Please try again.');
    }
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => navigation.goBack()} />}
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
