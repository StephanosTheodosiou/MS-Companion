import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BloodTestRow } from '../components/BloodTestRow';
import { Button } from '../components/Button';
import { Note } from '../components/Notice';
import { Row } from '../components/Row';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { TopBar } from '../components/TopBar';
import { repeatLabel } from '../constants/bloodTest';
import { StackProps } from '../navigation/types';
import { getConsents, listBloodTests, saveBloodTest } from '../services/storage';
import { BloodTest, ConsentMap } from '../types';
import { bloodTestStatus, dueText, markDone, sortBloodTests } from '../utils/bloodTest';

function details(test: BloodTest): string {
  return [dueText(test), test.repeat === 'none' ? '' : repeatLabel(test.repeat)].filter(Boolean).join(' · ');
}

// E3: reminders for the blood tests the MS team asks for. The app only reminds.
// Which tests are needed, and when, is decided by the doctor.
export function BloodTestsScreen({ navigation }: StackProps<'BloodTests'>) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [remindersOn, setRemindersOn] = useState(true);
  const [tests, setTests] = useState<BloodTest[]>([]);

  const load = useCallback(async () => {
    try {
      const [consents, all]: [ConsentMap, BloodTest[]] = await Promise.all([getConsents(), listBloodTests()]);
      setAllowed(consents.medication);
      setRemindersOn(consents.notifications);
      setTests(sortBloodTests(all));
    } catch (e) {
      console.warn('Could not load blood tests', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const topBar = <TopBar onBack={() => navigation.goBack()} />;

  // GDPR: blood-test reminders belong to medication data, so they follow the same choice.
  if (allowed === false) {
    return (
      <Screen
        topBar={topBar}
        title="Blood tests"
        subtitle="You chose not to let the app store your medication."
        footer={<Button label="Open Settings" onPress={() => navigation.navigate('Home', { screen: 'Settings' })} />}
      >
        <Note icon="info">To get blood test reminders, turn on Medication under "What the app may use".</Note>
      </Screen>
    );
  }

  const onDone = async (test: BloodTest) => {
    try {
      await saveBloodTest(markDone(test));
      await load();
    } catch (e) {
      console.warn('Could not mark blood test as done', e);
      Alert.alert('The blood test was not saved', 'Please try again.');
    }
  };

  const open = (test: BloodTest) => navigation.navigate('BloodTestEdit', { id: test.id });
  const withStatus = tests.map((test) => ({ test, status: bloodTestStatus(test) }));
  const attention = withStatus.filter((x) => x.status === 'overdue' || x.status === 'soon');
  const later = withStatus.filter((x) => x.status === 'later');
  const done = withStatus.filter((x) => x.status === 'done');

  return (
    <Screen
      topBar={topBar}
      title="Blood tests"
      subtitle="Reminders for the blood tests your MS team asks for."
      footer={<Button label="Add a blood test" onPress={() => navigation.navigate('BloodTestEdit')} />}
    >
      {!remindersOn ? (
        <Note icon="bell">Reminders are off. Turn on Reminders in Settings to be reminded.</Note>
      ) : null}

      {tests.length === 0 ? (
        <Section iconInset footer="Add a blood test and the date it is due. Your MS team tells you which tests you need.">
          <Row icon="droplet" label="No blood tests yet" />
        </Section>
      ) : null}

      {attention.length > 0 ? (
        <Section header="Due soon" iconInset footer="Tap Done after you have had the test.">
          {attention.map(({ test, status }) => (
            <BloodTestRow
              key={test.id}
              title={test.name}
              subtitle={details(test)}
              overdue={status === 'overdue'}
              onDone={() => onDone(test)}
              onOpen={() => open(test)}
            />
          ))}
        </Section>
      ) : null}

      {later.length > 0 ? (
        <Section header="Later" iconInset>
          {later.map(({ test }) => (
            <BloodTestRow key={test.id} title={test.name} subtitle={details(test)} onDone={() => onDone(test)} onOpen={() => open(test)} />
          ))}
        </Section>
      ) : null}

      {done.length > 0 ? (
        <Section header="Done" iconInset>
          {done.map(({ test }) => (
            <BloodTestRow key={test.id} title={test.name} subtitle={details(test)} onOpen={() => open(test)} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
