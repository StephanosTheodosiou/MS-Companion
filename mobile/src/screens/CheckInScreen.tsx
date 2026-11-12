import React, { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { OptionGroup } from '../components/OptionGroup';
import { ProgressBar } from '../components/ProgressBar';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TextField } from '../components/TextField';
import { LOW_MOOD_THRESHOLD, RATING_OPTIONS, ratingLabel, SYMPTOMS } from '../constants/checkIn';
import { RootStackParamList } from '../navigation/types';
import { getCheckIn, getProfile, saveCheckIn } from '../services/storage';
import { EMPTY_PROFILE, Profile, Rating, SymptomKey } from '../types';
import { todayKey } from '../utils/date';
import { toDialNumber } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

type Answers = Partial<Record<SymptomKey, Rating>>;

// E2: daily check-in. One question per step (less to take in at once), then an
// optional note and a review step, then a confirmation. Editing today's check-in
// reuses the same flow with the saved answers filled in.
export function CheckInScreen({ navigation }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [note, setNote] = useState('');
  const [step, setStep] = useState(0); // 0..5 questions, 6 = note and review
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });

  const reviewStep = SYMPTOMS.length;
  const totalSteps = SYMPTOMS.length + 1;

  useEffect(() => {
    getCheckIn(todayKey())
      .then((existing) => {
        if (existing) {
          setAnswers(existing.ratings);
          setNote(existing.note);
          setEditing(true);
        }
      })
      .catch((e) => console.warn('Could not load check-in', e));
    getProfile()
      .then(setProfile)
      .catch((e) => console.warn('Could not load profile', e));
  }, []);

  // After saving, "Done" is the only way out, so hide the back arrow.
  useEffect(() => {
    navigation.setOptions({ headerBackVisible: !saved, gestureEnabled: !saved });
  }, [navigation, saved]);

  // Ask before leaving with unsaved answers (back button or swipe).
  usePreventRemove(dirty && !saved, ({ data }) => {
    Alert.alert('Leave without saving?', 'Your answers for today will not be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const answer = (key: SymptomKey, rating: Rating) => {
    setAnswers((a) => ({ ...a, [key]: rating }));
    setDirty(true);
  };

  const allAnswered = SYMPTOMS.every((s) => answers[s.key] !== undefined);

  const onSave = async () => {
    if (!allAnswered) return;
    setSaving(true);
    try {
      await saveCheckIn({
        date: todayKey(),
        ratings: answers as Record<SymptomKey, Rating>,
        note: note.trim(),
        savedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (e) {
      console.warn('Could not save check-in', e);
      Alert.alert('Your check-in was not saved', 'Check your phone and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- After saving ----------
  if (saved) {
    const lowMood = (answers.mood ?? 0) >= LOW_MOOD_THRESHOLD;
    const teamName = profile.teamName.trim() || 'MS team';
    const hasPhone = profile.teamPhone.trim() !== '';
    return (
      <Screen
        title="Saved"
        subtitle="Thank you. Your check-in for today is saved and will be part of your visit summary."
        footer={<Button label="Done" onPress={() => navigation.goBack()} />}
      >
        {lowMood ? (
          <Section
            header="You said your mood has been low"
            footer="If you feel unsafe or think you might harm yourself, call 112 now."
          >
            <Row
              label="You don't have to handle this alone"
              description="Talking to someone can help. Your MS team can also support you with mood, which is common with MS."
            />
            {hasPhone ? (
              <Row
                label={`Call ${teamName}`}
                description={profile.teamPhone}
                chevron
                onPress={() =>
                  Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
                    Alert.alert('The call did not start', `Dial ${profile.teamPhone} from your phone app.`)
                  )
                }
              />
            ) : null}
          </Section>
        ) : null}
      </Screen>
    );
  }

  // ---------- Note and review ----------
  if (step === reviewStep) {
    return (
      <Screen
        title="Anything else?"
        subtitle="Add a note if something stood out today, then check your answers."
        footer={
          <>
            <Button
              label={editing ? 'Save changes' : 'Save check-in'}
              onPress={onSave}
              disabled={saving || !allAnswered}
            />
            <Button label="Back" variant="plain" onPress={() => setStep(step - 1)} />
          </>
        }
      >
        <ProgressBar step={totalSteps} total={totalSteps} />
        <TextField
          label="Note"
          hint="Optional. For example: bad night's sleep, very hot day, new symptom."
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setDirty(true);
          }}
          multiline
        />
        <Section header="Your answers" footer="Tap an answer to change it.">
          {SYMPTOMS.map((symptom, index) => {
            const rating = answers[symptom.key];
            return (
              <Row
                key={symptom.key}
                label={symptom.name}
                value={rating === undefined ? 'Not answered' : ratingLabel(rating)}
                chevron
                onPress={() => setStep(index)}
              />
            );
          })}
        </Section>
      </Screen>
    );
  }

  // ---------- One question ----------
  const symptom = SYMPTOMS[step];
  const current = answers[symptom.key];
  return (
    <Screen
      title={symptom.name}
      subtitle={symptom.question}
      footer={
        <>
          <Button label="Next" onPress={() => setStep(step + 1)} disabled={current === undefined} />
          {step > 0 ? (
            <Button label="Back" variant="plain" onPress={() => setStep(step - 1)} />
          ) : null}
        </>
      }
    >
      <ProgressBar step={step + 1} total={totalSteps} />
      <OptionGroup
        options={RATING_OPTIONS}
        selected={current ?? null}
        onSelect={(rating) => answer(symptom.key, rating)}
      />
      {step === 0 && !editing ? (
        <AppText variant="footnote">Think about today as a whole. There are no wrong answers.</AppText>
      ) : null}
    </Screen>
  );
}
