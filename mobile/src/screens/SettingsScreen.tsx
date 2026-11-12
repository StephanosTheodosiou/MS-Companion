import React, { useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Row, SwitchRow } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { SegmentedControl } from '../components/SegmentedControl';
import { RootStackParamList } from '../navigation/types';
import { deleteAllData, exportAllData, getConsents, setConsent } from '../services/storage';
import { useTextSize } from '../theme/TextSizeContext';
import { ConsentKey, ConsentMap, TextSize } from '../types';
import { OPTIONAL_CONSENTS } from './ConsentScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Largest' },
];

// E1: text size, withdrawing consent, and exporting or deleting data (GDPR).
export function SettingsScreen({ navigation }: Props) {
  const { size, setSize } = useTextSize();
  const [consents, setConsents] = useState<ConsentMap | null>(null);

  useEffect(() => {
    getConsents()
      .then(setConsents)
      .catch((e) => console.warn('Could not load consents', e));
  }, []);

  const onToggle = async (key: ConsentKey, value: boolean) => {
    setConsents((c) => (c ? { ...c, [key]: value } : c));
    try {
      await setConsent(key, value);
    } catch (e) {
      console.warn('Could not save consent', e);
      setConsents((c) => (c ? { ...c, [key]: !value } : c));
      Alert.alert('Your choice was not saved', 'Check your phone and try again.');
    }
  };

  const onExport = async () => {
    try {
      await Share.share({ title: 'MS Companion data', message: await exportAllData() });
    } catch (e) {
      console.warn('Could not export data', e);
      Alert.alert('Your data was not exported', 'Check your phone and try again.');
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete all your data?',
      'Your profile, choices and settings will be removed from this phone. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              setSize('normal', { persist: false });
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            } catch (e) {
              console.warn('Could not delete data', e);
              Alert.alert('Your data was not deleted', 'Check your phone and try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen title="Settings">
      <Section header="Text size" variant="plain">
        <SegmentedControl options={TEXT_SIZES} selected={size} onSelect={(s) => setSize(s)} />
      </Section>

      <Section
        header="What the app may use"
        footer="Symptom check-ins stay on while you use the app. To stop them, delete your data."
      >
        {consents
          ? OPTIONAL_CONSENTS.map((item) => (
              <SwitchRow
                key={item.key}
                label={item.label}
                description={item.description}
                value={consents[item.key]}
                onChange={(value) => onToggle(item.key, value)}
              />
            ))
          : null}
      </Section>

      <Section header="Your data">
        <Row label="Export my data" chevron onPress={onExport} />
        <Row label="Delete all my data" destructive onPress={onDelete} />
      </Section>
    </Screen>
  );
}
