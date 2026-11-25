import React, { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useConfirmLeave } from '@/hooks/use-confirm-leave';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { IconCircle } from '@/components/ui/app-icon';
import { SafetyCard } from '@/components/ui/notice';
import { RatingOption } from '@/components/ui/rating-option';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { StepHeader } from '@/components/layout/step-header';
import { TextField } from '@/components/ui/app-text-field';
import { LOW_MOOD_THRESHOLD, RATING_OPTIONS, ratingLabel, SYMPTOMS } from '@/constants/check-in';
import { getCheckIn, getProfile, saveCheckIn } from '@/utils/storage';
import { space } from '@/constants/design-tokens';
import { EMPTY_PROFILE, Profile, Rating, SymptomKey } from '@/types/health';
import { todayKey } from '@/utils/date';
import { toDialNumber } from '@/utils/validation';

type Answers = Partial<Record<SymptomKey, Rating>>;

// E2: daily check-in. One question per step (less to take in at once), then an
// optional note and a review step, then a confirmation. Editing today's check-in
// reuses the same flow with the saved answers filled in.
export default function CheckInScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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

  // After saving, "Done" is the only way out, so the swipe-back gesture is turned off.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !saved });
  }, [navigation, saved]);

  // Ask before leaving with unsaved answers (back button or swipe).
  useConfirmLeave(dirty && !saved, 'Your answers for today will not be saved.');

  const back = () => (step > 0 ? setStep(step - 1) : router.back());

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
      Alert.alert('Your check-in was not saved', 'Please try again.');
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
        header={<IconCircle name="check" size={72} />}
        title="Saved"
        subtitle="Thank you. Your check-in for today is saved and will be part of your visit summary."
        footer={<Button label="Done" onPress={() => router.back()} />}>
        {lowMood ? (
          <>
            <Section header="You said your mood has been low" iconInset>
              <Row
                icon="heart"
                strong
                label="You don't have to handle this alone"
                description="Talking to someone can help. Your MS team can also support you with mood, which is common with MS."
              />
              {hasPhone ? (
                <Row
                  icon="phone"
                  strong
                  label={`Call ${teamName}`}
                  description={profile.teamPhone}
                  chevron
                  accessibilityHint="Opens your phone app"
                  onPress={() =>
                    Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
                      Alert.alert(
                        'The call did not start',
                        `Dial ${profile.teamPhone} from your phone app.`,
                      ),
                    )
                  }
                />
              ) : null}
            </Section>
            <SafetyCard>
              If you feel unsafe or think you might harm yourself, call 112 now.
            </SafetyCard>
          </>
        ) : null}
      </Screen>
    );
  }

  // ---------- Note and review ----------
  if (step === reviewStep) {
    return (
      <Screen
        topBar={<StepHeader variant="flow" step={totalSteps} total={totalSteps} onBack={back} />}
        header={<IconCircle name="edit-3" size={72} />}
        title="Anything else?"
        subtitle="Add a note if something stood out today, then check your answers."
        footer={
          <Button
            label={editing ? 'Save changes' : 'Save check-in'}
            onPress={onSave}
            disabled={saving || !allAnswered}
          />
        }>
        <TextField
          label="Note"
          icon="edit-3"
          placeholder="For example: bad night's sleep, very hot day"
          hint="Optional."
          value={note}
          onChangeText={(text) => {
            setNote(text);
            setDirty(true);
          }}
          multiline
        />
        <Section header="Your answers" footer="Tap an answer to change it." iconInset>
          {SYMPTOMS.map((symptom, index) => {
            const rating = answers[symptom.key];
            return (
              <Row
                key={symptom.key}
                icon={symptom.icon}
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
      topBar={<StepHeader variant="flow" step={step + 1} total={totalSteps} onBack={back} />}
      header={<IconCircle name={symptom.icon} size={72} />}
      title={symptom.name}
      subtitle={symptom.question}
      footer={
        <Button label="Next" onPress={() => setStep(step + 1)} disabled={current === undefined} />
      }>
      <View style={{ gap: space.md }} accessibilityRole="radiogroup">
        {RATING_OPTIONS.map((option) => (
          <RatingOption
            key={option.value}
            value={option.value}
            label={option.label}
            selected={current === option.value}
            onPress={() => answer(symptom.key, option.value)}
          />
        ))}
      </View>
      {step === 0 && !editing ? (
        <AppText variant="footnote">
          {'Think about today as a whole.\nThere are no wrong answers.'}
        </AppText>
      ) : null}
    </Screen>
  );
}
