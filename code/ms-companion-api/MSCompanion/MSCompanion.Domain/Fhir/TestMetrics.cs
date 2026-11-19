using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Fhir;

public sealed record TestMetricDefinition(string Code, TestType TestType, string Display, string UcumUnit);

public static class TestMetrics
{
    public static IReadOnlyList<TestMetricDefinition> All { get; } =
    [
        new("symbol-digit-correct-count", TestType.SymbolDigit, "Symbol-digit test: correct responses", "{count}"),
        new("symbol-digit-error-count", TestType.SymbolDigit, "Symbol-digit test: errors", "{count}"),
        new("symbol-digit-accuracy", TestType.SymbolDigit, "Symbol-digit test: accuracy", "%"),
        new("symbol-digit-mean-response-time", TestType.SymbolDigit, "Symbol-digit test: mean response time", "ms"),

        new("finger-tapping-tap-count", TestType.FingerTapping, "Finger tapping: number of taps", "{taps}"),
        new("finger-tapping-tap-rate", TestType.FingerTapping, "Finger tapping: tap rate", "{taps}/s"),
        new("finger-tapping-intertap-mean", TestType.FingerTapping, "Finger tapping: mean inter-tap interval", "ms"),
        new("finger-tapping-intertap-cv", TestType.FingerTapping, "Finger tapping: inter-tap interval coefficient of variation", "%"),

        new("walking-duration", TestType.Walking, "Walking test: duration", "s"),
        new("walking-step-count", TestType.Walking, "Walking test: step count", "{steps}"),
        new("walking-cadence", TestType.Walking, "Walking test: cadence", "{steps}/min"),
        new("walking-step-time-cv", TestType.Walking, "Walking test: step time coefficient of variation", "%"),
    ];
}
