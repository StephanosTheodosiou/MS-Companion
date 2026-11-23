import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { Icon } from '@/components/ui/app-icon';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { deleteQuestion, listQuestions, saveQuestion } from '@/utils/storage';
import { useColors } from '@/hooks/use-colors';
import { DoctorQuestion } from '@/types/health';
import { newId } from '@/utils/id';

// E7: questions to ask at the next visit. Tap a question to tick it off once asked.
export default function QuestionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [draft, setDraft] = useState('');

  const reload = useCallback(() => {
    listQuestions()
      .then(setQuestions)
      .catch((e) => console.warn('Could not load questions', e));
  }, []);

  useFocusEffect(reload);

  const onAdd = async () => {
    if (draft.trim() === '') return;
    try {
      await saveQuestion({ id: newId(), text: draft.trim(), createdAt: new Date().toISOString(), asked: false });
      setDraft('');
      reload();
    } catch (e) {
      console.warn('Could not save question', e);
      Alert.alert('The question was not saved', 'Please try again.');
    }
  };

  const toggle = async (q: DoctorQuestion) => {
    await saveQuestion({ ...q, asked: !q.asked });
    reload();
  };

  const clearAsked = () => {
    Alert.alert('Remove asked questions?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          for (const q of questions.filter((x) => x.asked)) await deleteQuestion(q.id);
          reload();
        },
      },
    ]);
  };

  const toAsk = questions.filter((q) => !q.asked);
  const asked = questions.filter((q) => q.asked);

  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="Questions for my doctor"
      subtitle="Write questions down when you think of them. They appear on your visit summary."
    >
      <Section variant="plain">
        <TextField
          label="New question"
          icon="help-circle"
          value={draft}
          onChangeText={setDraft}
          multiline
          placeholder="For example: could the numbness be related to the heat?"
        />
        <Button label="Add question" onPress={onAdd} disabled={draft.trim() === ''} />
      </Section>

      <Section
        header="To ask"
        iconInset
        footer={toAsk.length === 0 ? 'No questions yet.' : 'Tap a question once you have asked it.'}
      >
        {toAsk.map((q) => (
          <Row
            key={q.id}
            icon="help-circle"
            label={q.text}
            onPress={() => toggle(q)}
            accessibilityRole="switch"
            accessibilityState={{ checked: false }}
          />
        ))}
      </Section>

      {asked.length > 0 ? (
        <Section header="Asked" iconInset>
          {asked.map((q) => (
            <Row
              key={q.id}
              icon="check-circle"
              label={q.text}
              onPress={() => toggle(q)}
              accessibilityRole="switch"
              accessibilityState={{ checked: true }}
              accessory={<Icon name="check" size={20} color={colors.accent} />}
            />
          ))}
          <Row icon="trash-2" label="Remove asked questions" destructive onPress={clearAsked} />
        </Section>
      ) : null}
      {asked.length > 0 ? <AppText variant="footnote">Asked questions no longer appear on the summary.</AppText> : null}
    </Screen>
  );
}
