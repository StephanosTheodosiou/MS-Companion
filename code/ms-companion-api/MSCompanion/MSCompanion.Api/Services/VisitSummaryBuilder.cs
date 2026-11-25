using MSCompanion.Api.Dto;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Services;

public sealed record VisitSummarySource(
    Patient Patient,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    DateOnly Today,
    Appointment? PreviousVisit,
    Appointment? UpcomingVisit,
    IReadOnlyList<CheckIn> CheckIns,
    IReadOnlyList<RelapseLogEntry> Relapses,
    IReadOnlyList<Medication> Medications,
    IReadOnlyList<MedicationIntake> Intakes,
    IReadOnlyList<SideEffect> SideEffects,
    IReadOnlyList<BloodTestReminder> BloodTests,
    IReadOnlyList<VisitQuestion> Questions);

public static class VisitSummaryBuilder
{
    public static VisitSummary Build(VisitSummarySource source) => new()
    {
        Patient = new VisitSummaryPatient
        {
            FirstName = source.Patient.User.FirstName,
            LastName = source.Patient.User.LastName,
            DateOfBirth = source.Patient.DateOfBirth,
            MsType = source.Patient.MsType,
            DiagnosisYear = source.Patient.DiagnosisYear,
        },
        PeriodStart = source.PeriodStart,
        PeriodEnd = source.PeriodEnd,
        PreviousVisit = ToAppointment(source.PreviousVisit),
        UpcomingVisit = ToAppointment(source.UpcomingVisit),
        CheckIns = BuildCheckIns(source),
        Relapses = source.Relapses.Select(e => new VisitSummaryRelapse
        {
            OnsetDate = e.OnsetDate,
            SymptomDescription = e.SymptomDescription,
            BodyArea = e.BodyArea,
            LastedOver24Hours = e.LastedOver24Hours,
            HadFever = e.HadFever,
            HeatExposure = e.HeatExposure,
            GuidanceShown = e.GuidanceShown,
            ContactedMsTeam = e.ContactedMsTeam,
            ResolvedOn = e.ResolvedOn,
        }).ToList(),
        Medications = BuildMedications(source),
        SideEffects = source.SideEffects.Select(s => new VisitSummarySideEffect
        {
            Description = s.Description,
            Severity = s.Severity,
            StartedOn = s.StartedOn,
            EndedOn = s.EndedOn,
            MedicationName = s.Medication?.Name,
        }).ToList(),
        BloodTests = source.BloodTests.Select(b => new VisitSummaryBloodTest
        {
            TestName = b.TestName,
            DueDate = b.DueDate,
            Overdue = b.DueDate < source.Today,
            MedicationName = b.Medication?.Name,
        }).ToList(),
        Questions = source.Questions.Select(q => new VisitSummaryQuestion { Text = q.Text }).ToList(),
    };

    private static VisitSummaryAppointment? ToAppointment(Appointment? appointment) =>
        appointment is null
            ? null
            : new VisitSummaryAppointment
            {
                StartsAt = appointment.StartsAt,
                Type = appointment.Type,
                ClinicianName = appointment.ClinicianName,
                Location = appointment.Location,
            };

    private static VisitSummaryCheckIns BuildCheckIns(VisitSummarySource source)
    {
        var answers = source.CheckIns.SelectMany(c => c.Answers).ToList();

        return new VisitSummaryCheckIns
        {
            DaysInPeriod = source.PeriodEnd.DayNumber - source.PeriodStart.DayNumber + 1,
            DaysCheckedIn = source.CheckIns.Count,
            LowMoodDays = answers.Count(a => a.Item == CheckInItem.Mood && LowMoodRule.IsLowMood(a.Score)),
            Items = DailyCheckInQuestionnaire.Items.Select(item =>
            {
                var scores = answers.Where(a => a.Item == item).Select(a => a.Score).ToList();
                return new VisitSummaryCheckInItem
                {
                    Item = item,
                    Text = DailyCheckInQuestionnaire.Text(item),
                    DaysAnswered = scores.Count,
                    Average = scores.Count == 0
                        ? null
                        : Math.Round((decimal)scores.Sum(s => s) / scores.Count, 1, MidpointRounding.AwayFromZero),
                    Best = scores.Count == 0 ? null : scores.Min(),
                    Worst = scores.Count == 0 ? null : scores.Max(),
                };
            }).ToList(),
        };
    }

    private static List<VisitSummaryMedication> BuildMedications(VisitSummarySource source)
    {
        var intakesByMedication = source.Intakes.ToLookup(i => i.MedicationId);

        return source.Medications
            .Where(m => m.Status != MedicationStatus.Stopped
                        || m.EndDate >= source.PeriodStart
                        || intakesByMedication[m.Id].Any())
            .OrderByDescending(m => m.IsDiseaseModifying)
            .ThenBy(m => m.Name, StringComparer.OrdinalIgnoreCase)
            .Select(m =>
            {
                var intakes = intakesByMedication[m.Id].ToList();
                var scheduled = intakes.Where(i => i.ScheduleId != null).ToList();
                var taken = scheduled.Count(i => i.Status == IntakeStatus.Taken);
                var skipped = scheduled.Count(i => i.Status == IntakeStatus.Skipped);
                var missed = scheduled.Count(i => i.Status == IntakeStatus.Missed);
                var due = taken + skipped + missed;

                return new VisitSummaryMedication
                {
                    Name = m.Name,
                    Dose = m.Dose,
                    IsDiseaseModifying = m.IsDiseaseModifying,
                    Status = m.Status,
                    DosesTaken = taken,
                    DosesSkipped = skipped,
                    DosesMissed = missed,
                    AsNeededDoses = intakes.Count(i => i.ScheduleId == null && i.Status == IntakeStatus.Taken),
                    AdherencePercent = due == 0
                        ? null
                        : Math.Round(100m * taken / due, 0, MidpointRounding.AwayFromZero),
                };
            })
            .ToList();
    }
}
