import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/app-button';
import { Note } from '@/components/ui/notice';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/layout/screen';
import { Section } from '@/components/layout/section';
import { TopBar } from '@/components/layout/top-bar';
import { SYMPTOMS } from '@/constants/check-in';
import { printSummary, shareSummaryPdf } from '@/utils/exportSummary';
import {
  getProfile,
  listAllDoseLogs,
  listAppointments,
  listCheckIns,
  listMedications,
  listQuestions,
  listSideEffects,
  listSymptomEntries,
} from '@/utils/storage';
import { Medication, Profile } from '@/types/health';
import { formatShortDate } from '@/utils/date';
import { buildVisitSummary, describeAverage, describeChange, VisitSummary } from '@/utils/summary';
import { visitSummaryHtml } from '@/utils/summaryHtml';
import { useAuth } from '@/context/auth-context';
import { appointmentDetails, appointmentTitle } from '@/utils/appointment';
import { MS_TYPES } from '@/constants/profile';

// E7: one page the neurologist can read before or during the visit.
// The same page can be shared as a PDF or printed (made on the phone, works offline).
export default function VisitSummaryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const patientName = user ? `${user.firstName} ${user.lastName}` : '';
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [
            appointments,
            checkIns,
            symptomEntries,
            doseLogs,
            meds,
            sideEffects,
            questions,
            prof,
          ] = await Promise.all([
            listAppointments(),
            listCheckIns(),
            listSymptomEntries(),
            listAllDoseLogs(),
            listMedications(),
            listSideEffects(),
            listQuestions(),
            getProfile(),
          ]);
          setSummary(
            buildVisitSummary({
              appointments,
              checkIns,
              symptomEntries,
              doseLogs,
              medications: meds,
              sideEffects,
              questions,
            }),
          );
          setProfile(prof);
          setMedications(meds);
        } catch (e) {
          console.warn('Could not build visit summary', e);
        }
      })();
    }, []),
  );

  const topBar = <TopBar onBack={() => router.back()} />;
  if (!summary || !profile)
    return (
      <Screen topBar={topBar} title="Visit summary">
        {null}
      </Screen>
    );

  const period = summary.lastVisit
    ? `Since your last visit on ${formatShortDate(summary.from)} (${summary.days} days)`
    : `Last ${summary.days} days`;
  const totalDoses = summary.dosesTaken + summary.dosesSkipped;
  const iconFor = (key: string) => SYMPTOMS.find((s) => s.key === key)?.icon ?? 'activity';

  const run = async (action: 'share' | 'print') => {
    setBusy(true);
    try {
      const html = visitSummaryHtml(summary, profile, medications, patientName);
      if (action === 'share') await shareSummaryPdf(html);
      else await printSummary(html);
    } catch (e) {
      console.warn('Could not export summary', e);
      // While developing, show the real reason so it can be fixed.
      const reason = e instanceof Error ? e.message : String(e);
      Alert.alert(
        action === 'share' ? 'The PDF could not be shared' : 'The summary could not be printed',
        __DEV__ ? `Reason: ${reason}` : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      topBar={topBar}
      title="Visit summary"
      subtitle={period}
      footer={
        <>
          <Button label="Share as PDF" onPress={() => run('share')} disabled={busy} />
          <Button label="Print" variant="plain" onPress={() => run('print')} disabled={busy} />
        </>
      }>
      {summary.nextVisit ? (
        <Section header="Next visit" iconInset>
          <Row
            icon="calendar"
            strong
            label={appointmentTitle(summary.nextVisit)}
            description={appointmentDetails(summary.nextVisit)}
          />
        </Section>
      ) : null}

      <Section header="About me" iconInset>
        <Row
          icon="user"
          label="Type of MS"
          value={MS_TYPES.find((t) => t.value === profile.msType)?.label ?? 'Not given'}
        />
        <Row
          icon="plus-square"
          label="Medicines"
          description={
            medications.length
              ? medications.map((m) => [m.name, m.dose].filter(Boolean).join(' ')).join(', ')
              : 'None added'
          }
        />
      </Section>

      <Section
        header="Daily check-ins"
        iconInset
        footer={
          summary.checkInDays > 0
            ? `${summary.checkInDays} of ${summary.days} days filled in. Scale: 0 not at all to 4 extremely.`
            : 'No check-ins in this period.'
        }>
        {summary.checkInDays > 0
          ? summary.symptoms.map((s) => (
              <Row
                key={s.key}
                icon={iconFor(s.key)}
                label={s.name}
                description={[
                  s.average !== null ? describeAverage(s.average) : null,
                  describeChange(s.change),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))
          : null}
        {summary.lowMoodDays > 0 ? (
          <Row
            icon="cloud-rain"
            label="Low mood"
            value={`${summary.lowMoodDays} ${summary.lowMoodDays === 1 ? 'day' : 'days'}`}
          />
        ) : null}
      </Section>

      <Section
        header="New or worse symptoms"
        iconInset
        footer={summary.symptomEntries.length === 0 ? 'None logged in this period.' : undefined}>
        {summary.symptomEntries.map((e) => (
          <Row
            key={e.id}
            icon="activity"
            label={e.description}
            description={[
              `Started ${formatShortDate(e.startedOn)}`,
              e.lastedOver24h ? 'lasted over 24 hours' : 'under 24 hours',
              e.feverOrHeat ? 'with fever or heat' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
        ))}
      </Section>

      <Section
        header="Medication"
        iconInset
        footer={totalDoses === 0 ? 'No doses logged in this period.' : undefined}>
        {totalDoses > 0 ? (
          <Row
            icon="check-square"
            label="Doses taken"
            value={`${summary.dosesTaken} of ${totalDoses} (${Math.round((summary.dosesTaken / totalDoses) * 100)}%)`}
          />
        ) : null}
        {summary.sideEffects.map((s, i) => (
          <Row
            key={i}
            icon="alert-circle"
            label={s.description}
            description={`Side effect · ${s.medicine} · ${formatShortDate(s.date)}`}
          />
        ))}
      </Section>

      <Section
        header="Questions for my doctor"
        iconInset
        footer={summary.openQuestions.length === 0 ? 'No open questions.' : undefined}>
        {summary.openQuestions.map((q) => (
          <Row key={q.id} icon="help-circle" label={q.text} />
        ))}
      </Section>

      <Note icon="info">
        Made with MS Companion from what you recorded. It is a record, not a diagnosis.
      </Note>
    </Screen>
  );
}
