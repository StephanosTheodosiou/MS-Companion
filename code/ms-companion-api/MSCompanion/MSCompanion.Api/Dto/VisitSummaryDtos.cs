using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

public sealed class VisitSummary
{
    public required VisitSummaryPatient Patient { get; init; }

    public required DateOnly PeriodStart { get; init; }

    public required DateOnly PeriodEnd { get; init; }

    public VisitSummaryAppointment? PreviousVisit { get; init; }

    public VisitSummaryAppointment? UpcomingVisit { get; init; }

    public required VisitSummaryCheckIns CheckIns { get; init; }

    public required List<VisitSummaryRelapse> Relapses { get; init; }

    public required List<VisitSummaryMedication> Medications { get; init; }

    public required List<VisitSummarySideEffect> SideEffects { get; init; }

    public required List<VisitSummaryBloodTest> BloodTests { get; init; }

    public required List<VisitSummaryQuestion> Questions { get; init; }
}

public sealed class VisitSummaryPatient
{
    public required string FirstName { get; init; }

    public required string LastName { get; init; }

    public DateOnly? DateOfBirth { get; init; }

    public MsType? MsType { get; init; }

    public short? DiagnosisYear { get; init; }
}

public sealed class VisitSummaryAppointment
{
    public required DateTimeOffset StartsAt { get; init; }

    public required AppointmentType Type { get; init; }

    public string? ClinicianName { get; init; }

    public string? Location { get; init; }
}

public sealed class VisitSummaryCheckIns
{
    public required int DaysInPeriod { get; init; }

    public required int DaysCheckedIn { get; init; }

    public required int LowMoodDays { get; init; }

    public required List<VisitSummaryCheckInItem> Items { get; init; }
}

public sealed class VisitSummaryCheckInItem
{
    public required CheckInItem Item { get; init; }

    public required string Text { get; init; }

    public required int DaysAnswered { get; init; }

    public decimal? Average { get; init; }

    public short? Best { get; init; }

    public short? Worst { get; init; }
}

public sealed class VisitSummaryRelapse
{
    public required DateOnly OnsetDate { get; init; }

    public required string SymptomDescription { get; init; }

    public string? BodyArea { get; init; }

    public required bool LastedOver24Hours { get; init; }

    public bool? HadFever { get; init; }

    public bool? HeatExposure { get; init; }

    public required RelapseGuidance GuidanceShown { get; init; }

    public required bool ContactedMsTeam { get; init; }

    public DateOnly? ResolvedOn { get; init; }
}

public sealed class VisitSummaryMedication
{
    public required string Name { get; init; }

    public string? Dose { get; init; }

    public required bool IsDiseaseModifying { get; init; }

    public required MedicationStatus Status { get; init; }

    public required int DosesTaken { get; init; }

    public required int DosesSkipped { get; init; }

    public required int DosesMissed { get; init; }

    public required int AsNeededDoses { get; init; }

    public decimal? AdherencePercent { get; init; }
}

public sealed class VisitSummarySideEffect
{
    public required string Description { get; init; }

    public required SideEffectSeverity Severity { get; init; }

    public required DateOnly StartedOn { get; init; }

    public DateOnly? EndedOn { get; init; }

    public string? MedicationName { get; init; }
}

public sealed class VisitSummaryBloodTest
{
    public required string TestName { get; init; }

    public required DateOnly DueDate { get; init; }

    public required bool Overdue { get; init; }

    public string? MedicationName { get; init; }
}

public sealed class VisitSummaryQuestion
{
    public required string Text { get; init; }
}
