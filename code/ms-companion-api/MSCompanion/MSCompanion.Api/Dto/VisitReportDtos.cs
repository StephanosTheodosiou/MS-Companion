using MSCompanion.Data.Models;

namespace MSCompanion.Api.Dto;

public sealed class CreateVisitReportRequest
{
    public Guid? AppointmentId { get; init; }
}

public sealed class VisitReportListItemDto
{
    public required Guid Id { get; init; }

    public Guid? AppointmentId { get; init; }

    public required DateOnly PeriodStart { get; init; }

    public required DateOnly PeriodEnd { get; init; }

    public required DateTimeOffset GeneratedAt { get; init; }

    public static VisitReportListItemDto FromEntity(VisitReport report) => new()
    {
        Id = report.Id,
        AppointmentId = report.AppointmentId,
        PeriodStart = report.PeriodStart,
        PeriodEnd = report.PeriodEnd,
        GeneratedAt = report.GeneratedAt,
    };
}

public sealed class VisitReportDto
{
    public required Guid Id { get; init; }

    public Guid? AppointmentId { get; init; }

    public required DateOnly PeriodStart { get; init; }

    public required DateOnly PeriodEnd { get; init; }

    public required DateTimeOffset GeneratedAt { get; init; }

    public required VisitSummary Summary { get; init; }
}

public sealed record VisitReportFile(string FileName, byte[] Content);
