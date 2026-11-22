using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Rules;

// Must match the rule in the app, which picks the guidance offline (US-01).
// A skipped answer (null) counts as "no", so the patient gets the safer advice.
public static class RelapseGuidanceRule
{
    public static RelapseGuidance For(bool lastedOver24Hours, bool? hadFever, bool? heatExposure) =>
        lastedOver24Hours && hadFever != true && heatExposure != true
            ? RelapseGuidance.ContactMsTeamToday
            : RelapseGuidance.MonitorAndRecheck;
}
