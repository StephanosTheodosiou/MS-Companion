import { Medication, Profile } from '@/types/health';
import { formatShortDate } from '@/utils/date';
import { describeAverage, describeChange, feverHeatNote, VisitSummary } from '@/utils/summary';

// Turns the visit summary (E7) into a one-page A4 HTML document, which expo-print
// converts to a PDF on the phone. Pure function, so it works offline and is easy to test.

export const MS_TYPE_LABEL: Record<string, string> = {
  RRMS: 'Relapsing-remitting',
  SPMS: 'Secondary progressive',
  PPMS: 'Primary progressive',
  CIS: 'Clinically isolated syndrome',
  UNSURE: 'Not sure',
};

/** Escapes user-typed text so it cannot break the HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const row = (label: string, value: string) =>
  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;

const empty = (text: string) => `<p class="empty">${escapeHtml(text)}</p>`;

/** "12 March 1985" */
function birthDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * @param patientName The account's first and last name; printed at the top with the date of birth (F11).
 */
export function visitSummaryHtml(
  summary: VisitSummary,
  profile: Profile,
  medications: Medication[],
  patientName = '',
): string {
  const patient = [
    patientName.trim() ? `<strong>${escapeHtml(patientName.trim())}</strong>` : '',
    profile.dateOfBirth ? `born ${escapeHtml(birthDate(profile.dateOfBirth))}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const period = summary.lastVisit
    ? `Since the last visit on ${formatShortDate(summary.from)} (${summary.days} days)`
    : `Last ${summary.days} days`;
  const totalDoses = summary.dosesTaken + summary.dosesSkipped;

  const checkIns =
    summary.checkInDays > 0
      ? `<table>${summary.symptoms
          .map((s) =>
            row(
              s.name,
              [s.average !== null ? describeAverage(s.average) : '', describeChange(s.change) ?? '']
                .filter(Boolean)
                .join(' · '),
            ),
          )
          .join(
            '',
          )}${summary.lowMoodDays > 0 ? row('Low mood', `${summary.lowMoodDays} day(s)`) : ''}</table>
         <p class="note">${summary.checkInDays} of ${summary.days} days filled in. Scale: 0 not at all to 4 extremely.</p>`
      : empty('No check-ins in this period.');

  const symptoms = summary.symptomEntries.length
    ? `<ul>${summary.symptomEntries
        .map(
          (e) =>
            `<li><strong>${escapeHtml(e.description)}</strong>. Started ${formatShortDate(e.startedOn)}, ${
              e.lastedOver24h ? 'lasted over 24 hours' : 'under 24 hours'
            }${feverHeatNote(e) ? `, ${feverHeatNote(e)}` : ''}.</li>`,
        )
        .join('')}</ul>`
    : empty('None logged in this period.');

  const medication = `<table>
      ${row('Medicines', medications.length ? medications.map((m) => [m.name, m.dose].filter(Boolean).join(' ')).join(', ') : 'None added')}
      ${totalDoses > 0 ? row('Doses taken', `${summary.dosesTaken} of ${totalDoses} (${Math.round((summary.dosesTaken / totalDoses) * 100)}%)`) : row('Doses taken', 'None logged')}
    </table>
    ${
      summary.sideEffects.length
        ? `<ul>${summary.sideEffects
            .map(
              (s) =>
                `<li>Side effect: ${escapeHtml(s.description)} (${[
                  s.severity,
                  s.medicine,
                  `started ${formatShortDate(s.date)}`,
                ]
                  .filter(Boolean)
                  .map((x) => escapeHtml(String(x)))
                  .join(', ')})</li>`,
            )
            .join('')}</ul>`
        : ''
    }`;

  const questions = summary.openQuestions.length
    ? `<ol>${summary.openQuestions.map((q) => `<li>${escapeHtml(q.text)}</li>`).join('')}</ol>`
    : empty('No open questions.');

  const next = summary.nextVisit
    ? `Next visit: ${formatShortDate(summary.nextVisit.date)}, ${summary.nextVisit.time}${
        summary.nextVisit.withWhom ? ` with ${escapeHtml(summary.nextVisit.withWhom)}` : ''
      }`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #0F1B2A; font-size: 10.5pt; line-height: 1.4; }
  header { border-bottom: 2px solid #12707B; padding-bottom: 6pt; margin-bottom: 10pt; }
  h1 { font-size: 17pt; margin: 0; }
  .meta { color: #5D6B7A; margin: 2pt 0 0; }
  .patient { margin: 4pt 0 0; font-size: 12pt; }
  h2 { font-size: 11pt; color: #12707B; margin: 12pt 0 4pt; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 3pt 0; border-bottom: 1px solid #E6EAEE; }
  th { width: 34%; font-weight: 600; }
  ul, ol { margin: 4pt 0; padding-left: 16pt; }
  li { margin: 2pt 0; }
  .note, .empty { color: #5D6B7A; margin: 3pt 0; }
  footer { margin-top: 14pt; color: #5D6B7A; font-size: 9pt; border-top: 1px solid #E6EAEE; padding-top: 6pt; }
</style></head>
<body>
  <header>
    <h1>MS Companion: visit summary</h1>
    ${patient ? `<p class="patient">${patient}</p>` : ''}
    <p class="meta">${escapeHtml(period)}. Type of MS: ${escapeHtml(profile.msType ? MS_TYPE_LABEL[profile.msType] : 'not given')}.</p>
    ${next ? `<p class="meta">${next}</p>` : ''}
  </header>
  <h2>Daily check-ins</h2>${checkIns}
  <h2>New or worse symptoms</h2>${symptoms}
  <h2>Medication</h2>${medication}
  <h2>Questions for the doctor</h2>${questions}
  <footer>Created on ${formatShortDate(summary.to)} with MS Companion from what the patient recorded. It is a record, not a diagnosis.</footer>
</body></html>`;
}
