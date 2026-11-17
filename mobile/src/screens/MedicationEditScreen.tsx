import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { CheckCards } from '../components/ChoiceCards';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { DOSE_TIMES, sortTimes } from '../constants/medication';
import { StackProps } from '../navigation/types';
import { deleteMedication, getMedication, saveMedication } from '../services/storage';
import { colors } from '../theme/theme';
import { DoseTime } from '../types';
import { newId } from '../utils/id';

// E3: add or edit a medicine and when it is taken.
export function MedicationEditScreen({ navigation, route }: StackProps<'MedicationEdit'>) {
  const editingId = route.params?.id;
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
    setTimes((current) => (current.includes(time) ? current.filter((t) => t !== time) : sortTimes([...current, time])));
    setTimesError(false);
  };

  const onSave = async () => {
    const missingName = name.trim() === '';
    setNameError(missingName ? 'Enter the name of the medicine.' : null);
    setTimesError(times.length === 0);
    if (missingName || times.length === 0) return;
    setSaving(true);
    try {
      await saveMedication({ id: editingId ?? newId(), name: name.trim(), dose: dose.trim(), times });
      navigation.goBack();
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
            navigation.goBack();
          } catch (e) {
            console.warn('Could not remove medicine', e);
          }
        },
      },
    ]);
  };

  return (
    <Screen
      topBar={<TopBar onBack={() => navigation.goBack()} />}
      title={editingId ? 'Edit medicine' : 'Add a medicine'}
      footer={<Button label="Save" onPress={onSave} disabled={saving} />}
    >
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
        <TextField label="Dose" icon="info" placeholder="For example: 500 mg, 1 tablet" hint="Optional." value={dose} onChangeText={setDose} />
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
