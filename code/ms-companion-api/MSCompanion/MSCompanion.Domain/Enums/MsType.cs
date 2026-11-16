namespace MSCompanion.Domain.Enums;

/// <summary>The patient's MS type, as they report it. Stored as text.</summary>
public enum MsType
{
    RelapsingRemitting,         // RRMS
    SecondaryProgressive,       // SPMS
    PrimaryProgressive,         // PPMS
    ClinicallyIsolatedSyndrome, // CIS
    NotSure,
}
