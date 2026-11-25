import { SOON_DAYS } from '@/constants/blood-test';
import { BloodTest } from '@/types/health';
import { daysBetween, formatShortDate, todayKey } from '@/utils/date';

// Rules for blood-test reminders (E3). Pure functions: no storage or screen code,
// so they are easy to unit test and the notification code can reuse them later.

export type BloodTestStatus = 'overdue' | 'soon' | 'later' | 'done';

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDaysKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

/** Adds whole months and keeps the date valid (31 Jan + 1 month = 28 Feb). */
export function addMonthsKey(key: string, months: number): string {
  const d = parseKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return todayKey(d);
}

/** A one-off test that was marked as done has nothing left to remind about. */
export function isFinished(test: BloodTest): boolean {
  return test.repeat === 'none' && test.lastDoneOn !== null;
}

export function bloodTestStatus(test: BloodTest, today: string = todayKey()): BloodTestStatus {
  if (isFinished(test)) return 'done';
  const days = daysBetween(today, test.dueDate);
  if (days < 0) return 'overdue';
  return days <= SOON_DAYS ? 'soon' : 'later';
}

/** e.g. "Due tomorrow", "Overdue by 3 days", "Due Mon 9 Nov". */
export function dueText(test: BloodTest, today: string = todayKey()): string {
  if (isFinished(test))
    return test.lastDoneOn ? `Done ${formatShortDate(test.lastDoneOn)}` : 'Done';
  const days = daysBetween(today, test.dueDate);
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? 'day' : 'days'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= SOON_DAYS) return `Due in ${days} days`;
  return `Due ${formatShortDate(test.dueDate)}`;
}

/** The day the reminder should go off (YYYY-MM-DD). Used when notifications are scheduled. */
export function reminderDate(test: BloodTest): string {
  return addDaysKey(test.dueDate, -Number(test.remindDaysBefore));
}

/** Marks a test as done today. Repeating tests move on to their next due date. */
export function markDone(test: BloodTest, today: string = todayKey()): BloodTest {
  if (test.repeat === 'none') return { ...test, lastDoneOn: today };
  return { ...test, lastDoneOn: today, dueDate: addMonthsKey(today, Number(test.repeat)) };
}

/** Overdue first, then soonest due, finished tests last. */
export function sortBloodTests(tests: BloodTest[]): BloodTest[] {
  return [...tests].sort((a, b) => {
    const fa = isFinished(a) ? 1 : 0;
    const fb = isFinished(b) ? 1 : 0;
    return fa - fb || a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
  });
}

/** Short text for the Today tab, or undefined when nothing needs attention. */
export function bloodTestSummary(
  tests: BloodTest[],
  today: string = todayKey(),
): string | undefined {
  const statuses = tests.map((t) => bloodTestStatus(t, today));
  const overdue = statuses.filter((s) => s === 'overdue').length;
  if (overdue > 0) return `${overdue} overdue`;
  const soon = statuses.filter((s) => s === 'soon').length;
  return soon > 0 ? `${soon} due soon` : undefined;
}
