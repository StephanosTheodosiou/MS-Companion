using System.Globalization;
using MSCompanion.Api.Dto;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;
using MSCompanion.Domain.Rules;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MSCompanion.Api.Services;

public static class VisitReportPdf
{
    private const string Ink = "#0B1A2A";
    private const string Secondary = "#5F6F7D";
    private const string Brand = "#0F6E7A";
    private const string BrandRange = "#9CCBD1";
    private const string Line = "#E2E8ED";
    private const string Panel = "#F4F6F8";
    private const string Danger = "#C0392B";
    private const string None = "—";
    private const float DateWidth = 64;

    private static readonly CultureInfo Culture = CultureInfo.InvariantCulture;

    private static readonly string Scale = $"{DailyCheckInQuestionnaire.MinScore}–{DailyCheckInQuestionnaire.MaxScore}";

    public static byte[] Render(VisitReportDto report, TimeZoneInfo zone)
    {
        var summary = report.Summary;
        var document = Document.Create(container => container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(14, Unit.Millimetre);
            page.DefaultTextStyle(style => style.FontSize(9).FontColor(Ink));
            page.Header().Element(c => Header(c, report, zone));
            page.Content().PaddingVertical(10).Column(column =>
            {
                column.Spacing(12);
                column.Item().Element(c => Overview(c, report, zone));
                column.Item().Element(c => Relapses(c, summary.Relapses));
                column.Item().Element(c => CheckIns(c, summary.CheckIns));
                column.Item().Element(c => Medications(c, summary.Medications));
                column.Item().Element(c => SideEffects(c, summary.SideEffects));
                column.Item().Element(c => BloodTests(c, summary.BloodTests));
                column.Item().Element(c => Questions(c, summary.Questions));
            });
            page.Footer().Element(Footer);
        }));

        return document
            .WithMetadata(new DocumentMetadata
            {
                Title = "Visit summary",
                Subject = $"{Date(summary.PeriodStart)} to {Date(summary.PeriodEnd)}",
                Creator = "MS Companion",
                Language = "en",
                CreationDate = report.GeneratedAt,
                ModifiedDate = report.GeneratedAt,
            })
            .GeneratePdf();
    }

    private static void Header(IContainer container, VisitReportDto report, TimeZoneInfo zone)
    {
        var summary = report.Summary;
        container.BorderBottom(1.5f).BorderColor(Brand).PaddingBottom(6).Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("Visit summary").FontSize(17).Bold().FontColor(Brand);
                column.Item().Text(FullName(summary.Patient)).FontSize(11).SemiBold();
            });
            row.AutoItem().AlignBottom().Column(column =>
            {
                column.Item().AlignRight().Text(text =>
                {
                    text.Span($"{Date(summary.PeriodStart)} – {Date(summary.PeriodEnd)}").SemiBold();
                    text.Span($"  ·  {Days(summary.CheckIns.DaysInPeriod)}").FontColor(Secondary);
                });
                column.Item().AlignRight().Text($"Generated {LocalDateTime(report.GeneratedAt, zone)}")
                    .FontSize(8).FontColor(Secondary);
            });
        });
    }

    private static void Overview(IContainer container, VisitReportDto report, TimeZoneInfo zone)
    {
        var summary = report.Summary;
        var visitTitle = summary.UpcomingVisit?.StartsAt <= report.GeneratedAt ? "This visit" : "Upcoming visit";
        container.Row(row =>
        {
            row.Spacing(8);
            row.RelativeItem().Element(c => Card(c, "Patient", PatientLines(summary.Patient, summary.PeriodEnd)));
            row.RelativeItem().Element(c => Card(c, visitTitle, summary.UpcomingVisit is { } next
                ? VisitLines(next, LocalDateTime(next.StartsAt, zone))
                : ["No visit booked"]));
            row.RelativeItem().Element(c => Card(c, "Previous visit", summary.PreviousVisit is { } last
                ? VisitLines(last, LocalDate(last.StartsAt, zone))
                : ["None recorded", $"This summary covers the last {Days(summary.CheckIns.DaysInPeriod)}"]));
        });
    }

    private static void Card(IContainer container, string title, IReadOnlyList<string> lines)
    {
        container.Background(Panel).Padding(8).Column(column =>
        {
            column.Spacing(1);
            column.Item().PaddingBottom(2).Text(title.ToUpperInvariant())
                .FontSize(7).SemiBold().FontColor(Secondary).LetterSpacing(0.06f);
            for (var i = 0; i < lines.Count; i++)
            {
                var text = column.Item().Text(lines[i]);
                if (i == 0)
                {
                    text.SemiBold();
                }
                else
                {
                    text.FontColor(Secondary);
                }
            }
        });
    }

    private static List<string> PatientLines(VisitSummaryPatient patient, DateOnly on)
    {
        var lines = new List<string>();
        if (patient.MsType is { } type)
        {
            lines.Add(MsTypeText(type));
        }

        if (patient.DateOfBirth is { } born)
        {
            lines.Add($"Born {Date(born)} (age {Age(born, on)})");
        }

        if (patient.DiagnosisYear is { } year)
        {
            lines.Add($"Diagnosed in {year}");
        }

        return lines.Count > 0 ? lines : ["No profile details given"];
    }

    private static List<string> VisitLines(VisitSummaryAppointment visit, string when)
    {
        var lines = new List<string>
        {
            when,
            string.IsNullOrWhiteSpace(visit.ClinicianName)
                ? AppointmentText(visit.Type)
                : $"{AppointmentText(visit.Type)} · {visit.ClinicianName}",
        };
        if (!string.IsNullOrWhiteSpace(visit.Location))
        {
            lines.Add(visit.Location);
        }

        return lines;
    }

    private static void Relapses(IContainer container, List<VisitSummaryRelapse> relapses) =>
        Block(container, "New or worsening symptoms", "Logged by the patient", body =>
        {
            if (relapses.Count == 0)
            {
                Empty(body, "None logged in this period.");
                return;
            }

            body.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(DateWidth);
                    columns.RelativeColumn();
                    columns.ConstantColumn(44);
                    columns.ConstantColumn(36);
                    columns.ConstantColumn(36);
                    columns.ConstantColumn(56);
                    columns.ConstantColumn(DateWidth);
                });
                table.Header(header =>
                {
                    header.Cell().Element(HeadCell).Text("Started");
                    header.Cell().Element(HeadCell).Text("Symptom");
                    header.Cell().Element(HeadCell).Text("Over 24 h");
                    header.Cell().Element(HeadCell).Text("Fever");
                    header.Cell().Element(HeadCell).Text("Heat");
                    header.Cell().Element(HeadCell).Text("Contacted team");
                    header.Cell().Element(HeadCell).Text("Resolved");
                });
                foreach (var relapse in relapses)
                {
                    table.Cell().Element(Cell).Text(Date(relapse.OnsetDate));
                    table.Cell().Element(Cell).Column(column =>
                    {
                        column.Item().Text(text =>
                        {
                            text.Span(relapse.SymptomDescription).SemiBold();
                            if (!string.IsNullOrWhiteSpace(relapse.BodyArea))
                            {
                                text.Span($"  ·  {relapse.BodyArea}").FontColor(Secondary);
                            }
                        });
                        column.Item().Text($"App advice: {GuidanceText(relapse.GuidanceShown)}")
                            .FontSize(7.5f).FontColor(Secondary);
                    });
                    table.Cell().Element(Cell).Text(YesNo(relapse.LastedOver24Hours));
                    table.Cell().Element(Cell).Text(YesNo(relapse.HadFever));
                    table.Cell().Element(Cell).Text(YesNo(relapse.HeatExposure));
                    table.Cell().Element(Cell).Text(YesNo(relapse.ContactedMsTeam));
                    table.Cell().Element(Cell).Text(relapse.ResolvedOn is { } resolved ? Date(resolved) : "Ongoing");
                }
            });
        });

    private static void CheckIns(IContainer container, VisitSummaryCheckIns checkIns) =>
        Block(container, "Daily check-ins", $"Scores {Scale}: {DailyCheckInQuestionnaire.MinScore} = no problem, {DailyCheckInQuestionnaire.MaxScore} = worst", body =>
        {
            if (checkIns.DaysCheckedIn == 0)
            {
                Empty(body, "No check-ins in this period.");
                return;
            }

            body.Column(column =>
            {
                column.Spacing(5);
                column.Item().Text(text =>
                {
                    text.Span("Checked in on ");
                    text.Span($"{checkIns.DaysCheckedIn} of {Days(checkIns.DaysInPeriod)}").SemiBold();
                    text.Span($". Low mood (mood score {LowMoodRule.Threshold} or more) on ");
                    text.Span(Days(checkIns.LowMoodDays)).SemiBold();
                    text.Span(".");
                });
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2.2f);
                        columns.ConstantColumn(42);
                        columns.ConstantColumn(46);
                        columns.ConstantColumn(36);
                        columns.ConstantColumn(38);
                        columns.RelativeColumn(1.6f);
                    });
                    table.Header(header =>
                    {
                        header.Cell().Element(HeadCell).Text("Symptom");
                        header.Cell().Element(HeadCell).AlignCenter().Text("Days");
                        header.Cell().Element(HeadCell).AlignCenter().Text("Average");
                        header.Cell().Element(HeadCell).AlignCenter().Text("Best");
                        header.Cell().Element(HeadCell).AlignCenter().Text("Worst");
                        header.Cell().Element(HeadCell).Text($"Range ({Scale})");
                    });
                    foreach (var item in checkIns.Items)
                    {
                        table.Cell().Element(Cell).Text(item.Text);
                        table.Cell().Element(Cell).AlignCenter().Text(item.DaysAnswered.ToString(Culture));
                        table.Cell().Element(Cell).AlignCenter().Text(item.Average?.ToString("0.0", Culture) ?? None);
                        table.Cell().Element(Cell).AlignCenter().Text(item.Best?.ToString(Culture) ?? None);
                        table.Cell().Element(Cell).AlignCenter().Text(item.Worst?.ToString(Culture) ?? None);
                        if (item is { Best: { } best, Worst: { } worst, Average: { } average })
                        {
                            table.Cell().Element(Cell).AlignMiddle().Height(9)
                                .Svg(size => RangeSvg(size, best, worst, average));
                        }
                        else
                        {
                            table.Cell().Element(Cell).Text(None);
                        }
                    }
                });
            });
        });

    private static void Medications(IContainer container, List<VisitSummaryMedication> medications) =>
        Block(container, "Medicines", "Adherence = taken ÷ (taken + skipped + missed) scheduled doses", body =>
        {
            if (medications.Count == 0)
            {
                Empty(body, "No medicines recorded.");
                return;
            }

            body.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(46);
                    columns.ConstantColumn(38);
                    columns.ConstantColumn(42);
                    columns.ConstantColumn(40);
                    columns.ConstantColumn(54);
                    columns.ConstantColumn(50);
                });
                table.Header(header =>
                {
                    header.Cell().Element(HeadCell).Text("Medicine");
                    header.Cell().Element(HeadCell).Text("Status");
                    header.Cell().Element(HeadCell).AlignCenter().Text("Taken");
                    header.Cell().Element(HeadCell).AlignCenter().Text("Skipped");
                    header.Cell().Element(HeadCell).AlignCenter().Text("Missed");
                    header.Cell().Element(HeadCell).AlignCenter().Text("Adherence");
                    header.Cell().Element(HeadCell).AlignCenter().Text("As needed");
                });
                foreach (var medication in medications)
                {
                    table.Cell().Element(Cell).Text(text =>
                    {
                        text.Span(medication.Name).SemiBold();
                        if (medication.IsDiseaseModifying)
                        {
                            text.Span("  DMT").FontSize(7).Bold().FontColor(Brand);
                        }

                        if (!string.IsNullOrWhiteSpace(medication.Dose))
                        {
                            text.Span($"  ·  {medication.Dose}").FontColor(Secondary);
                        }
                    });
                    table.Cell().Element(Cell).Text(medication.Status.ToString());
                    table.Cell().Element(Cell).AlignCenter().Text(medication.DosesTaken.ToString(Culture));
                    table.Cell().Element(Cell).AlignCenter().Text(medication.DosesSkipped.ToString(Culture));
                    table.Cell().Element(Cell).AlignCenter().Text(medication.DosesMissed.ToString(Culture));
                    table.Cell().Element(Cell).AlignCenter()
                        .Text(medication.AdherencePercent is { } percent ? $"{percent.ToString("0", Culture)}%" : None)
                        .SemiBold();
                    table.Cell().Element(Cell).AlignCenter().Text(medication.AsNeededDoses.ToString(Culture));
                }
            });
        });

    private static void SideEffects(IContainer container, List<VisitSummarySideEffect> sideEffects) =>
        Block(container, "Side effects", null, body =>
        {
            if (sideEffects.Count == 0)
            {
                Empty(body, "None logged in this period.");
                return;
            }

            body.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(54);
                    columns.RelativeColumn(0.6f);
                    columns.ConstantColumn(DateWidth);
                    columns.ConstantColumn(DateWidth);
                });
                table.Header(header =>
                {
                    header.Cell().Element(HeadCell).Text("Side effect");
                    header.Cell().Element(HeadCell).Text("Severity");
                    header.Cell().Element(HeadCell).Text("Medicine");
                    header.Cell().Element(HeadCell).Text("Started");
                    header.Cell().Element(HeadCell).Text("Ended");
                });
                foreach (var sideEffect in sideEffects)
                {
                    table.Cell().Element(Cell).Text(sideEffect.Description);
                    var severity = table.Cell().Element(Cell).Text(sideEffect.Severity.ToString());
                    if (sideEffect.Severity == SideEffectSeverity.Severe)
                    {
                        severity.SemiBold().FontColor(Danger);
                    }

                    table.Cell().Element(Cell).Text(sideEffect.MedicationName ?? None);
                    table.Cell().Element(Cell).Text(Date(sideEffect.StartedOn));
                    table.Cell().Element(Cell).Text(sideEffect.EndedOn is { } ended ? Date(ended) : "Ongoing");
                }
            });
        });

    private static void BloodTests(IContainer container, List<VisitSummaryBloodTest> bloodTests) =>
        Block(container, "Blood tests due", null, body =>
        {
            if (bloodTests.Count == 0)
            {
                Empty(body, "No blood tests due.");
                return;
            }

            body.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.RelativeColumn(0.8f);
                    columns.ConstantColumn(DateWidth);
                    columns.ConstantColumn(58);
                });
                table.Header(header =>
                {
                    header.Cell().Element(HeadCell).Text("Test");
                    header.Cell().Element(HeadCell).Text("For medicine");
                    header.Cell().Element(HeadCell).Text("Due");
                    header.Cell().Element(HeadCell).Text("Status");
                });
                foreach (var bloodTest in bloodTests)
                {
                    table.Cell().Element(Cell).Text(bloodTest.TestName);
                    table.Cell().Element(Cell).Text(bloodTest.MedicationName ?? None);
                    table.Cell().Element(Cell).Text(Date(bloodTest.DueDate));
                    if (bloodTest.Overdue)
                    {
                        table.Cell().Element(Cell).Text("Overdue").SemiBold().FontColor(Danger);
                    }
                    else
                    {
                        table.Cell().Element(Cell).Text("Upcoming");
                    }
                }
            });
        });

    private static void Questions(IContainer container, List<VisitSummaryQuestion> questions) =>
        Block(container, "Questions for this visit", null, body =>
        {
            if (questions.Count == 0)
            {
                Empty(body, "No questions added.");
                return;
            }

            body.Column(column =>
            {
                column.Spacing(3);
                for (var i = 0; i < questions.Count; i++)
                {
                    var question = questions[i];
                    var number = i + 1;
                    column.Item().Row(row =>
                    {
                        row.ConstantItem(16).Text($"{number}.").SemiBold().FontColor(Brand);
                        row.RelativeItem().Text(question.Text);
                    });
                }
            });
        });

    private static void Footer(IContainer container) =>
        container.BorderTop(0.5f).BorderColor(Line).PaddingTop(4).Row(row =>
        {
            row.RelativeItem()
                .Text("Patient-reported information from the MS Companion app. It supports, but does not replace, clinical assessment.")
                .FontSize(7).FontColor(Secondary);
            row.AutoItem().PaddingLeft(8).Text(text =>
            {
                text.DefaultTextStyle(style => style.FontSize(7).FontColor(Secondary));
                text.Span("Page ");
                text.CurrentPageNumber();
                text.Span(" of ");
                text.TotalPages();
            });
        });

    private static void Block(IContainer container, string title, string? note, Action<IContainer> body) =>
        container.EnsureSpace(60).Column(column =>
        {
            column.Item().BorderBottom(0.75f).BorderColor(Line).PaddingBottom(3).Row(row =>
            {
                row.AutoItem().Text(title).FontSize(11).SemiBold().FontColor(Brand);
                if (note is not null)
                {
                    row.RelativeItem().AlignRight().AlignBottom().Text(note).FontSize(7.5f).FontColor(Secondary);
                }
            });
            column.Item().PaddingTop(4).Element(body);
        });

    private static void Empty(IContainer container, string text) =>
        container.Text(text).FontColor(Secondary).Italic();

    private static IContainer HeadCell(IContainer container) =>
        container.Background(Panel).PaddingVertical(3).PaddingHorizontal(4)
            .DefaultTextStyle(style => style.FontSize(7.5f).SemiBold().FontColor(Secondary));

    private static IContainer Cell(IContainer container) =>
        container.BorderBottom(0.5f).BorderColor(Line).PaddingVertical(3).PaddingHorizontal(4);

    private static string RangeSvg(Size size, short best, short worst, decimal average)
    {
        var radius = size.Height / 2;
        var track = size.Width - 2 * radius;
        const double span = DailyCheckInQuestionnaire.MaxScore - DailyCheckInQuestionnaire.MinScore;
        float X(double score) => radius + (float)((score - DailyCheckInQuestionnaire.MinScore) / span) * track;
        var from = X(best);
        var to = X(worst);
        return FormattableString.Invariant(
            $"""
            <svg xmlns="http://www.w3.org/2000/svg" width="{size.Width}" height="{size.Height}" viewBox="0 0 {size.Width} {size.Height}">
              <rect x="{radius}" y="{radius - 1.5f}" width="{track}" height="3" rx="1.5" fill="{Line}"/>
              <rect x="{from}" y="{radius - 2.5f}" width="{to - from}" height="5" rx="2.5" fill="{BrandRange}"/>
              <circle cx="{X((double)average)}" cy="{radius}" r="{radius - 0.5f}" fill="{Brand}" stroke="#FFFFFF" stroke-width="1"/>
            </svg>
            """);
    }

    private static string FullName(VisitSummaryPatient patient) => $"{patient.FirstName} {patient.LastName}".Trim();

    private static string Date(DateOnly date) => date.ToString("d MMM yyyy", Culture);

    private static string LocalDate(DateTimeOffset instant, TimeZoneInfo zone) =>
        TimeZoneInfo.ConvertTime(instant, zone).ToString("d MMM yyyy", Culture);

    private static string LocalDateTime(DateTimeOffset instant, TimeZoneInfo zone) =>
        TimeZoneInfo.ConvertTime(instant, zone).ToString("d MMM yyyy, HH:mm", Culture);

    private static string YesNo(bool? value) => value switch
    {
        true => "Yes",
        false => "No",
        null => None,
    };

    private static string Days(int count) => count == 1 ? "1 day" : $"{count} days";

    private static int Age(DateOnly born, DateOnly on)
    {
        var age = on.Year - born.Year;
        return on < born.AddYears(age) ? age - 1 : age;
    }

    private static string MsTypeText(MsType type) => type switch
    {
        MsType.RelapsingRemitting => "Relapsing-remitting MS",
        MsType.SecondaryProgressive => "Secondary progressive MS",
        MsType.PrimaryProgressive => "Primary progressive MS",
        MsType.ClinicallyIsolatedSyndrome => "Clinically isolated syndrome",
        MsType.NotSure => "MS type not known",
        _ => type.ToString(),
    };

    private static string AppointmentText(AppointmentType type) => type switch
    {
        AppointmentType.Neurologist => "Neurologist",
        AppointmentType.MsNurse => "MS nurse",
        AppointmentType.Infusion => "Infusion",
        AppointmentType.BloodTest => "Blood test",
        AppointmentType.Mri => "MRI scan",
        _ => "Appointment",
    };

    private static string GuidanceText(RelapseGuidance guidance) => guidance switch
    {
        RelapseGuidance.ContactMsTeamToday => "contact the MS team today",
        RelapseGuidance.MonitorAndRecheck => "monitor and log again if it continues",
        _ => guidance.ToString(),
    };
}
