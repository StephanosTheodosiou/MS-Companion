import { Rating, SymptomKey } from '@/types/health';
import { daysAgoKey } from '@/utils/date';
import {
  addSideEffect,
  completeOnboarding,
  logDose,
  saveAllConsents,
  saveAppointment,
  saveBloodTest,
  saveCheckIn,
  saveMedication,
  saveProfile,
  saveQuestion,
  saveSymptomEntry,
} from '@/utils/storage';

// Made-up sample data for testing and demos (no real patient data).
// Fills about two weeks of history so the visit summary has something to show.
export async function loadDemoData(): Promise<void> {
  await saveAllConsents({ symptoms: true, medication: true, notifications: true, location: false });
  await saveProfile({
    msType: 'RRMS',
    medication: '',
    teamName: 'Nicosia General MS Clinic',
    teamPhone: '22 603 000',
  });

  await saveMedication({
    id: 'demo-fin',
    name: 'Fingolimod',
    dose: '0.5 mg, 1 capsule',
    times: ['08:00'],
  });
  await saveMedication({
    id: 'demo-bac',
    name: 'Baclofen',
    dose: '10 mg',
    times: ['08:00', '19:00'],
  });

  // Fatigue and walking get a little worse over the last week.
  for (let ago = 14; ago >= 1; ago--) {
    if (ago === 9 || ago === 4) continue; // two missed days, like a real person
    const later = ago <= 6 ? 1 : 0;
    const ratings: Record<SymptomKey, Rating> = {
      fatigue: Math.min(4, 1 + later + (ago % 3 === 0 ? 1 : 0)) as Rating,
      mobility: Math.min(4, 1 + later) as Rating,
      pain: (ago % 4 === 0 ? 1 : 0) as Rating,
      mood: (ago === 3 ? 3 : 1) as Rating,
      cognition: 1 as Rating,
      bladder: (ago % 5 === 0 ? 1 : 0) as Rating,
    };
    const date = daysAgoKey(ago);
    await saveCheckIn({
      date,
      ratings,
      note: ago === 3 ? 'Very hot day, slept badly.' : '',
      savedAt: `${date}T09:00:00.000Z`,
    });
    await logDose({
      medicationId: 'demo-fin',
      date,
      time: '08:00',
      status: 'taken',
      loggedAt: `${date}T08:05:00.000Z`,
    });
    await logDose({
      medicationId: 'demo-bac',
      date,
      time: '08:00',
      status: 'taken',
      loggedAt: `${date}T08:05:00.000Z`,
    });
    await logDose({
      medicationId: 'demo-bac',
      date,
      time: '19:00',
      status: ago % 6 === 0 ? 'skipped' : 'taken',
      loggedAt: `${date}T19:10:00.000Z`,
    });
  }

  await addSideEffect({
    id: 'demo-se1',
    medicationId: 'demo-bac',
    description: 'Drowsy after the evening dose',
    loggedAt: `${daysAgoKey(5)}T20:00:00.000Z`,
  });
  await saveSymptomEntry({
    id: 'demo-sx1',
    description: 'Numbness in my left leg',
    startedOn: daysAgoKey(4),
    lastedOver24h: true,
    feverOrHeat: false,
    createdAt: `${daysAgoKey(2)}T10:00:00.000Z`,
    syncStatus: 'waiting',
  });

  await saveAppointment({
    id: 'demo-a1',
    date: daysAgoKey(15),
    time: '10:30',
    withWhom: 'Dr Andreas',
    place: 'Nicosia General Hospital',
    notes: '',
  });
  await saveAppointment({
    id: 'demo-a2',
    date: daysAgoKey(-7),
    time: '11:00',
    withWhom: 'Dr Andreas',
    place: 'Nicosia General Hospital',
    notes: 'Bring blood test results.',
  });

  await saveBloodTest({
    id: 'demo-b1',
    name: 'Full blood count',
    dueDate: daysAgoKey(2),
    repeat: '3',
    remindDaysBefore: '1',
    notes: '',
    lastDoneOn: daysAgoKey(92),
  });
  await saveBloodTest({
    id: 'demo-b2',
    name: 'Liver function test',
    dueDate: daysAgoKey(-6),
    repeat: '6',
    remindDaysBefore: '7',
    notes: 'Fasting needed.',
    lastDoneOn: null,
  });
  await saveBloodTest({
    id: 'demo-b3',
    name: 'Vitamin D',
    dueDate: daysAgoKey(-60),
    repeat: 'none',
    remindDaysBefore: '1',
    notes: '',
    lastDoneOn: null,
  });

  await saveQuestion({
    id: 'demo-q1',
    text: 'Could the leg numbness be related to the heat?',
    createdAt: `${daysAgoKey(2)}T10:05:00.000Z`,
    asked: false,
  });
  await saveQuestion({
    id: 'demo-q2',
    text: 'Should I change the time of my Baclofen dose?',
    createdAt: `${daysAgoKey(1)}T18:00:00.000Z`,
    asked: false,
  });

  await completeOnboarding();
}
