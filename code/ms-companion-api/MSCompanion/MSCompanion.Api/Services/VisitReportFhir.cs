using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;
using FhirPatient = Hl7.Fhir.Model.Patient;
using PatientEntity = MSCompanion.Data.Models.Patient;

namespace MSCompanion.Api.Services;

public static class VisitReportFhir
{
    public const string MediaType = "application/fhir+json";

    private const string UuidSystem = "urn:ietf:rfc:3986";
    private const string OrdinalValueExtension = "http://hl7.org/fhir/StructureDefinition/ordinalValue";
    private const string ItemControlExtension = "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl";
    private const string ItemControlSystem = "http://hl7.org/fhir/questionnaire-item-control";

    private static readonly CultureInfo Culture = CultureInfo.InvariantCulture;

    private static readonly JsonSerializerOptions StoreJson = new JsonSerializerOptions().ForFhir(ModelInfo.ModelInspector);

    private static readonly JsonSerializerOptions ExportJson =
        new JsonSerializerOptions { NewLine = "\n" }.ForFhir(ModelInfo.ModelInspector).Pretty();

    public static string Build(VisitReport report, PatientEntity patient, IReadOnlyList<CheckIn> checkIns)
    {
        var patientUrl = Urn(patient.Id);
        var bundle = new Bundle
        {
            Id = report.Id.ToString(),
            Identifier = new Identifier(UuidSystem, Urn(report.Id)),
            Type = Bundle.BundleType.Collection,
            Timestamp = report.GeneratedAt,
        };
        Add(bundle, patientUrl, ToPatient(patient));

        var responses = checkIns.OrderBy(c => c.LocalDate).ThenBy(c => c.Id).ToList();
        if (responses.Count > 0)
        {
            Add(bundle, CanonicalFullUrl("CodeSystem", DailyCheckInQuestionnaire.AnswerSystemId), AnswerCodeSystem());
            foreach (var version in responses.Select(c => c.QuestionnaireVersion).Distinct().Order(StringComparer.Ordinal))
            {
                Add(bundle, CanonicalFullUrl("Questionnaire", QuestionnaireId(version)), ToQuestionnaire(version));
            }

            foreach (var checkIn in responses)
            {
                Add(bundle, Urn(checkIn.Id), ToResponse(checkIn, patientUrl));
            }
        }

        return JsonSerializer.Serialize(bundle, StoreJson);
    }

    public static string Export(string storedJson) =>
        JsonSerializer.Serialize(JsonSerializer.Deserialize<Bundle>(storedJson, StoreJson), ExportJson);

    private static FhirPatient ToPatient(PatientEntity patient)
    {
        var name = new HumanName { Use = HumanName.NameUse.Official };
        if (!string.IsNullOrWhiteSpace(patient.User.LastName))
        {
            name.Family = patient.User.LastName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(patient.User.FirstName))
        {
            name.Given = [patient.User.FirstName.Trim()];
        }

        var resource = new FhirPatient
        {
            Id = patient.Id.ToString(),
            Identifier = [new Identifier(UuidSystem, Urn(patient.Id))],
            Name = [name],
            BirthDate = patient.DateOfBirth?.ToString("yyyy-MM-dd", Culture),
        };

        var summary = new StringBuilder(Encode(string.Join(' ', name.Given.Append(name.Family).OfType<string>())));
        if (patient.DateOfBirth is { } born)
        {
            summary.Append(", born ").Append(born.ToString("d MMMM yyyy", Culture));
        }

        resource.Text = Html($"<p>{summary}</p>");
        return resource;
    }

    private static CodeSystem AnswerCodeSystem()
    {
        var concepts = Scores()
            .Select(score => new CodeSystem.ConceptDefinitionComponent
            {
                Code = ScoreCode(score),
                Display = DailyCheckInQuestionnaire.AnswerLabel(score),
            })
            .ToList();

        return new CodeSystem
        {
            Id = DailyCheckInQuestionnaire.AnswerSystemId,
            Url = DailyCheckInQuestionnaire.AnswerSystem,
            Version = DailyCheckInQuestionnaire.AnswerSystemVersion,
            Name = "SymptomImpact",
            Title = "Symptom impact",
            Status = PublicationStatus.Active,
            Experimental = false,
            Publisher = FhirCanonical.Publisher,
            Description = "How much a symptom affected the patient on the day of a daily check-in, "
                + $"from {DailyCheckInQuestionnaire.MinScore} (not at all) to {DailyCheckInQuestionnaire.MaxScore} (extremely).",
            CaseSensitive = true,
            Content = CodeSystemContentMode.Complete,
            Count = concepts.Count,
            Concept = concepts,
            Text = Html(
                "<p>Symptom impact</p><ul>"
                + string.Concat(Scores().Select(s => $"<li>{ScoreCode(s)}: {Encode(DailyCheckInQuestionnaire.AnswerLabel(s))}</li>"))
                + "</ul>"),
        };
    }

    private static Questionnaire ToQuestionnaire(string version)
    {
        var items = DailyCheckInQuestionnaire.ItemsByVersion[version];
        var questionnaire = new Questionnaire
        {
            Id = QuestionnaireId(version),
            Url = DailyCheckInQuestionnaire.Url,
            Version = version,
            Name = DailyCheckInQuestionnaire.Name,
            Title = DailyCheckInQuestionnaire.Title,
            Status = PublicationStatus.Active,
            Experimental = false,
            SubjectType = [ResourceType.Patient],
            Publisher = FhirCanonical.Publisher,
            Description = "Daily symptom check-in from the MS Companion app. Each question asks how much a symptom "
                + $"affected the patient today, from {DailyCheckInQuestionnaire.MinScore} (not at all) "
                + $"to {DailyCheckInQuestionnaire.MaxScore} (extremely).",
            Item = items.Select(ToQuestion).Append(NoteQuestion()).ToList(),
        };

        questionnaire.Text = Html(
            $"<p>{Encode(DailyCheckInQuestionnaire.Title)}, version {Encode(version)}</p><ol>"
            + string.Concat(items.Select(i => $"<li>{Encode(DailyCheckInQuestionnaire.Question(i))}</li>"))
            + $"<li>{Encode(DailyCheckInQuestionnaire.NoteText)} (optional)</li></ol><p>Answers: "
            + Encode(string.Join(", ", Scores().Select(s => $"{s} = {DailyCheckInQuestionnaire.AnswerLabel(s)}")))
            + "</p>");
        return questionnaire;
    }

    private static Questionnaire.ItemComponent ToQuestion(CheckInItem item)
    {
        var question = new Questionnaire.ItemComponent
        {
            LinkId = item.ToString(),
            Text = DailyCheckInQuestionnaire.Question(item),
            Type = Questionnaire.QuestionnaireItemType.Choice,
            Required = true,
            Repeats = false,
            AnswerOption = Scores()
                .Select(score => new Questionnaire.AnswerOptionComponent
                {
                    Value = Answer(score),
                    Extension = [new Extension(OrdinalValueExtension, new FhirDecimal(score))],
                })
                .ToList(),
        };
        question.Extension.Add(new Extension(
            ItemControlExtension,
            new CodeableConcept { Coding = [new Coding(ItemControlSystem, "radio-button", "Radio Button")] }));
        return question;
    }

    private static Questionnaire.ItemComponent NoteQuestion() => new()
    {
        LinkId = DailyCheckInQuestionnaire.NoteLinkId,
        Text = DailyCheckInQuestionnaire.NoteText,
        Type = Questionnaire.QuestionnaireItemType.Text,
        Required = false,
        Repeats = false,
        MaxLength = DailyCheckInQuestionnaire.NoteMaxLength,
    };

    private static QuestionnaireResponse ToResponse(CheckIn checkIn, string patientUrl)
    {
        var response = new QuestionnaireResponse
        {
            Id = checkIn.Id.ToString(),
            Questionnaire = $"{DailyCheckInQuestionnaire.Url}|{checkIn.QuestionnaireVersion}",
            Status = checkIn.UpdatedAt > checkIn.CreatedAt
                ? QuestionnaireResponse.QuestionnaireResponseStatus.Amended
                : QuestionnaireResponse.QuestionnaireResponseStatus.Completed,
            Subject = new ResourceReference(patientUrl),
            AuthoredElement = new FhirDateTime(LocalTime(checkIn.UpdatedAt, checkIn.TimeZone)),
            Author = new ResourceReference(patientUrl),
            Source = new ResourceReference(patientUrl),
        };

        var lines = new StringBuilder();
        foreach (var item in DailyCheckInQuestionnaire.ItemsByVersion[checkIn.QuestionnaireVersion])
        {
            if (checkIn.Answers.FirstOrDefault(a => a.Item == item) is not { } answer)
            {
                continue;
            }

            response.Item.Add(new QuestionnaireResponse.ItemComponent
            {
                LinkId = item.ToString(),
                Text = DailyCheckInQuestionnaire.Question(item),
                Answer = [new QuestionnaireResponse.AnswerComponent { Value = Answer(answer.Score) }],
            });
            lines.Append(CultureInfo.InvariantCulture, $"<li>{Encode(DailyCheckInQuestionnaire.Text(item))}: ")
                .Append(CultureInfo.InvariantCulture, $"{Encode(DailyCheckInQuestionnaire.AnswerLabel(answer.Score))} ({answer.Score})</li>");
        }

        if (!string.IsNullOrWhiteSpace(checkIn.Note))
        {
            response.Item.Add(new QuestionnaireResponse.ItemComponent
            {
                LinkId = DailyCheckInQuestionnaire.NoteLinkId,
                Text = DailyCheckInQuestionnaire.NoteText,
                Answer = [new QuestionnaireResponse.AnswerComponent { Value = new FhirString(checkIn.Note.Trim()) }],
            });
            lines.Append(CultureInfo.InvariantCulture, $"<li>Note: {Encode(checkIn.Note.Trim())}</li>");
        }

        response.Text = Html(
            $"<p>{Encode(DailyCheckInQuestionnaire.Title)} for {checkIn.LocalDate.ToString("d MMMM yyyy", Culture)}</p><ul>{lines}</ul>");
        return response;
    }

    private static void Add(Bundle bundle, string fullUrl, Resource resource) =>
        bundle.Entry.Add(new Bundle.EntryComponent { FullUrl = fullUrl, Resource = resource });

    private static Coding Answer(short score) =>
        new(DailyCheckInQuestionnaire.AnswerSystem, ScoreCode(score), DailyCheckInQuestionnaire.AnswerLabel(score));

    private static IEnumerable<short> Scores()
    {
        for (var score = DailyCheckInQuestionnaire.MinScore; score <= DailyCheckInQuestionnaire.MaxScore; score++)
        {
            yield return score;
        }
    }

    private static string ScoreCode(short score) => score.ToString(Culture);

    private static string QuestionnaireId(string version) => $"{DailyCheckInQuestionnaire.Id}-v{version}";

    private static string CanonicalFullUrl(string type, string id) => $"{FhirCanonical.Base}/{type}/{id}";

    private static string Urn(Guid id) => $"urn:uuid:{id}";

    private static DateTimeOffset LocalTime(DateTimeOffset instant, string timeZone)
    {
        var zone = TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out var found) ? found : TimeZoneInfo.Utc;
        var local = TimeZoneInfo.ConvertTime(instant, zone);
        return local.AddTicks(-(local.Ticks % TimeSpan.TicksPerSecond));
    }

    private static Narrative Html(string xhtml) => new()
    {
        Status = Hl7.Fhir.Model.Narrative.NarrativeStatus.Generated,
        Div = $"<div xmlns=\"http://www.w3.org/1999/xhtml\">{xhtml}</div>",
    };

    private static string Encode(string text) => WebUtility.HtmlEncode(text);
}
