import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSaveGuard } from '@/hooks/use-save-guard';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { PickerRow } from '@/components/ui/picker-row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { SEVERITY_OPTIONS } from '@/constants/medication';
import { useColors } from '@/hooks/use-colors';
import { addSideEffect, listMedications } from '@/utils/storage';
import { Medication, SideEffectSeverity } from '@/types/health';
import { formatShortDate, todayKey } from '@/utils/date';
import { newId } from '@/utils/id';

/** Chosen when the patient does not know which medicine caused it. Saved as null. */
const NOT_SURE = 'not-sure';

/** "2026-11-17" -> local Date at midday (avoids time-zone edge cases). */
function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

// E3: note a side effect so the neurologist sees it in the visit summary.
// The fields match the API's SaveSideEffectRequest (N3): severity and start date are required,
// the medicine is optional because the patient may not know which one caused it.
export default function SideEffectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { saving, guard } = useSaveGuard();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicine, setMedicine] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SideEffectSeverity | null>(null);
  const [startedOn, setStartedOn] = useState<string>(todayKey());
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [severityError, setSeverityError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    listMedications()
      .then(setMedications)
      .catch((e) => console.warn('Could not load medicines', e));
  }, []);

  const onSave = () =>
    guard(async () => {
      const missingDescription = description.trim() === '';
      const inFuture = startedOn > todayKey();
      setDescriptionError(missingDescription ? 'Describe the side effect.' : null);
      setSeverityError(severity ? null : 'Choose how bad it is.');
      setDateError(inFuture ? 'The start date cannot be in the future.' : null);
      if (missingDescription || !severity || inFuture) return;
      try {
        await addSideEffect({
          id: newId(),
          medicationId: medicine && medicine !== NOT_SURE ? medicine : null,
          description: description.trim(),
          severity,
          startedOn,
          loggedAt: new Date().toISOString(),
        });
        router.back();
      } catch (e) {
        console.warn('Could not save side effect', e);
        Alert.alert('The side effect was not saved', 'Please try again.');
      }
    });

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="Note a side effect"
      subtitle="Do not stop or change a medicine on your own. Talk to your doctor first."
      footer={<Button label="Save" onPress={onSave} disabled={saving} />}>
      <TextField
        label="What happened?"
        icon="edit-3"
        placeholder="For example: headache after the evening dose"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setDescriptionError(null);
        }}
        multiline
        error={descriptionError}
      />

      <ChoiceCards
        header="How bad is it?"
        options={SEVERITY_OPTIONS}
        selected={severity}
        onSelect={(value) => {
          setSeverity(value);
          setSeverityError(null);
        }}
      />
      {severityError ? (
        <AppText variant="footnote" color={colors.destructive} accessibilityLiveRegion="polite">
          {severityError}
        </AppText>
      ) : null}

      <Section header="When did it start?" iconInset>
        <PickerRow
          label="Started"
          mode="date"
          value={keyToDate(startedOn)}
          display={startedOn === todayKey() ? 'Today' : formatShortDate(startedOn)}
          maximumDate={new Date()}
          onChange={(d) => {
            setStartedOn(todayKey(d));
            setDateError(null);
          }}
          error={dateError}
        />
      </Section>

      {medications.length > 0 ? (
        <ChoiceCards
          header="Which medicine? (optional)"
          options={[
            ...medications.map((m) => ({ value: m.id, label: m.name })),
            { value: NOT_SURE, label: "I'm not sure" },
          ]}
          selected={medicine}
          onSelect={setMedicine}
        />
      ) : null}
    </Screen>
  );
}
