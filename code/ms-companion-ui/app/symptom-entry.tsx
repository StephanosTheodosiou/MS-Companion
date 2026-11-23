import React, { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/app-button';
import { ChoiceCards } from '@/components/ui/choice-cards';
import { IconCircle, IconName } from '@/components/ui/app-icon';
import { SafetyCard } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TextField } from '@/components/ui/app-text-field';
import { TopBar } from '@/components/layout/top-bar';
import { getProfile, saveSymptomEntry } from '@/utils/storage';
import { colors } from '@/constants/design-tokens';
import { EMPTY_PROFILE, Profile } from '@/types/health';
import { daysAgoKey } from '@/utils/date';
import { EMERGENCY_NOTE, GUIDANCE_TEXT, Guidance, symptomGuidance } from '@/utils/guidance';
import { newId } from '@/utils/id';
import { toDialNumber } from '@/utils/validation';

type StartedOption = '0' | '1' | '2' | '3';
type YesNo = 'yes' | 'no' | 'unsure';

const STARTED: { value: StartedOption; label: string }[] = [
  { value: '0', label: 'Today' },
  { value: '1', label: 'Yesterday' },
  { value: '2', label: '2 days ago' },
  { value: '3', label: '3 or more days ago' },
];

const LASTED: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes, more than 24 hours' },
  { value: 'no', label: 'No, less than 24 hours' },
  { value: 'unsure', label: "I'm not sure yet" },
];

const FEVER: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const GUIDANCE_ICON: Record<Guidance, IconName> = {
  'contact-team': 'phone',
  'fever-or-heat': 'thermometer',
  'keep-watching': 'eye',
};

// E3 / US-01: log a new or worse symptom, then show what to do next.
// The guidance text lives in the app, so it also works without internet (Scenario 2).
export default function SymptomEntryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [description, setDescription] = useState('');
  const [started, setStarted] = useState<StartedOption | null>(null);
  const [lasted, setLasted] = useState<YesNo | null>(null);
  const [fever, setFever] = useState<YesNo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Guidance | null>(null);
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((e) => console.warn('Could not load profile', e));
  }, []);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !result });
  }, [navigation, result]);

  const dirty = description !== '' || started !== null || lasted !== null || fever !== null;
  // Uses expo-router's own navigation (a separate @react-navigation install would not be connected to it).
  useEffect(() => {
    if (!(dirty && !result)) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert('Leave without saving?', 'This symptom will not be saved.', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, dirty, result]);

  const onSave = async () => {
    if (description.trim() === '' || !started || !lasted || !fever) {
      setError('Please answer all four questions.');
      return;
    }
    const lastedOver24h = lasted === 'yes';
    const feverOrHeat = fever === 'yes';
    try {
      await saveSymptomEntry({
        id: newId(),
        description: description.trim(),
        startedOn: daysAgoKey(Number(started)),
        lastedOver24h,
        feverOrHeat,
        createdAt: new Date().toISOString(),
        syncStatus: 'waiting',
      });
      setResult(symptomGuidance(lastedOver24h, feverOrHeat));
    } catch (e) {
      console.warn('Could not save symptom', e);
      Alert.alert('The symptom was not saved', 'Please try again.');
    }
  };

  // ---------- Guidance after saving ----------
  if (result) {
    const text = GUIDANCE_TEXT[result];
    const teamName = profile.teamName.trim() || 'MS team';
    const hasPhone = profile.teamPhone.trim() !== '';
    const call = () =>
      Linking.openURL(`tel:${toDialNumber(profile.teamPhone)}`).catch(() =>
        Alert.alert('The call did not start', `Dial ${profile.teamPhone} from your phone app.`)
      );
    const urgent = result === 'contact-team';
    return (
      <Screen
        header={<IconCircle name={GUIDANCE_ICON[result]} size={72} />}
        title={text.title}
        subtitle={text.body}
        footer={
          <>
            {hasPhone ? (
              <Button label={`Call ${teamName}`} onPress={call} variant={urgent ? 'primary' : 'plain'} />
            ) : null}
            <Button label="Done" variant={hasPhone && urgent ? 'plain' : 'primary'} onPress={() => router.back()} />
          </>
        }
      >
        <Section iconInset>
          <Row
            icon="check"
            strong
            label="Saved in your symptom log"
            description="Added to your next visit summary. Saved on this phone, waiting to sync. It uploads when you are back online."
          />
          {!hasPhone ? (
            <Row
              icon="phone"
              label="Add your MS team's number"
              description="To call them with one tap."
              chevron
              onPress={() => router.navigate('/profile')}
            />
          ) : null}
        </Section>
        <SafetyCard>{EMERGENCY_NOTE}</SafetyCard>
      </Screen>
    );
  }

  // ---------- Form ----------
  return (
    <Screen
      topBar={<TopBar onBack={() => router.back()} />}
      title="New or worse symptom"
      subtitle="Answer four short questions. The app will tell you what to do next."
      footer={<Button label="Save" onPress={onSave} />}
    >
      <TextField
        label="What is new or worse?"
        icon="edit-3"
        placeholder="For example: numbness in my left leg"
        value={description}
        onChangeText={(t) => {
          setDescription(t);
          setError(null);
        }}
        multiline
      />
      <ChoiceCards header="When did it start?" options={STARTED} selected={started} onSelect={setStarted} />
      <ChoiceCards header="Has it lasted more than 24 hours?" options={LASTED} selected={lasted} onSelect={setLasted} />
      <ChoiceCards
        header="Fever, infection or very hot?"
        options={FEVER}
        selected={fever}
        onSelect={setFever}
      />
      {error ? (
        <AppText variant="footnote" color={colors.destructive} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <SafetyCard>{EMERGENCY_NOTE}</SafetyCard>
    </Screen>
  );
}
