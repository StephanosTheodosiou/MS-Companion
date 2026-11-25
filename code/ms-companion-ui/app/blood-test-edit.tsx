import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { PickerRow } from '@/components/ui/picker-row';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { REMIND_OPTIONS, REPEAT_OPTIONS } from '@/constants/blood-test';
import { deleteBloodTest, getBloodTest, saveBloodTest } from '@/utils/storage';
import { BloodTest, BloodTestRepeat, RemindBefore } from '@/types/health';
import { isFinished, markDone } from '@/utils/bloodTest';
import { todayKey } from '@/utils/date';
import { newId } from '@/utils/id';

/** "2026-11-17" -> local Date at midday (avoids time-zone edge cases). */
function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

// E3: add or edit a blood test reminder.
export default function BloodTestEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const [existing, setExisting] = useState<BloodTest | null>(null);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<BloodTestRepeat>('none');
  const [remind, setRemind] = useState<RemindBefore>('1');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    getBloodTest(editingId)
      .then((t) => {
        if (!t) return;
        setExisting(t);
        setName(t.name);
        setDueDate(t.dueDate);
        setRepeat(t.repeat);
        setRemind(t.remindDaysBefore);
        setNotes(t.notes);
      })
      .catch((e) => console.warn('Could not load blood test', e));
  }, [editingId]);

  const onSave = async () => {
    const missingName = name.trim() === '';
    setNameError(missingName ? 'Enter the name of the blood test.' : null);
    setDateError(dueDate ? null : 'Choose the date it is due.');
    if (missingName || !dueDate) return;
    setSaving(true);
    try {
      await saveBloodTest({
        id: editingId ?? newId(),
        name: name.trim(),
        dueDate,
        repeat,
        remindDaysBefore: remind,
        notes: notes.trim(),
        lastDoneOn: existing?.lastDoneOn ?? null,
      });
      router.back();
    } catch (e) {
      console.warn('Could not save blood test', e);
      Alert.alert('The blood test was not saved', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onMarkDone = async () => {
    if (!existing) return;
    try {
      await saveBloodTest(
        markDone({
          ...existing,
          name: name.trim() || existing.name,
          dueDate: dueDate ?? existing.dueDate,
          repeat,
          remindDaysBefore: remind,
          notes: notes.trim(),
        }),
      );
      router.back();
    } catch (e) {
      console.warn('Could not mark blood test as done', e);
      Alert.alert('The blood test was not saved', 'Please try again.');
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert('Remove this blood test?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBloodTest(editingId);
            router.back();
          } catch (e) {
            console.warn('Could not remove blood test', e);
          }
        },
      },
    ]);
  };

  const dateLabel = dueDate
    ? keyToDate(dueDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const finished = existing ? isFinished(existing) : false;

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title={editingId ? 'Edit blood test' : 'Add a blood test'}
      subtitle="Your MS team tells you which blood tests you need and when."
      footer={<Button label="Save" onPress={onSave} disabled={saving} />}>
      <Section variant="plain">
        <TextField
          label="Name"
          icon="droplet"
          placeholder="For example: Full blood count"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError(null);
          }}
          autoCapitalize="sentences"
          error={nameError}
        />
      </Section>

      <Section header="When" iconInset>
        <PickerRow
          label="Due date"
          mode="date"
          value={dueDate ? keyToDate(dueDate) : null}
          display={dateLabel}
          onChange={(d) => {
            setDueDate(todayKey(d));
            setDateError(null);
          }}
          error={dateError}
        />
      </Section>

      <ChoiceCards
        header="How often?"
        options={REPEAT_OPTIONS}
        selected={repeat}
        onSelect={setRepeat}
      />
      <ChoiceCards
        header="Remind me"
        options={REMIND_OPTIONS}
        selected={remind}
        onSelect={setRemind}
      />
      <AppText variant="footnote">Reminders need Reminders to be turned on in Profile.</AppText>

      <Section variant="plain">
        <TextField
          label="Notes"
          icon="edit-3"
          placeholder="For example: fasting needed, bring the form"
          hint="Optional."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Section>

      {editingId ? (
        <Section iconInset>
          {!finished ? <Row icon="check-circle" label="Mark as done" onPress={onMarkDone} /> : null}
          <Row icon="trash-2" label="Remove this blood test" destructive onPress={onDelete} />
        </Section>
      ) : null}
    </Screen>
  );
}
