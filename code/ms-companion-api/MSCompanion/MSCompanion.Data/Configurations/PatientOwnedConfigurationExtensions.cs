using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

// Column names are snake_case (UseSnakeCaseNamingConvention), so raw SQL in check constraints
// and index filters in this folder uses snake_case too.
internal static class PatientOwnedConfigurationExtensions
{
    /// <summary>
    /// Standard wiring for every patient-owned table: primary key generated on the phone,
    /// FK to patient (cascade on GDPR erasure) and the sync-pull index.
    /// </summary>
    public static void OwnedByPatient<T>(
        this EntityTypeBuilder<T> builder,
        Expression<Func<Patient, IEnumerable<T>?>>? patientCollection = null)
        where T : PatientOwnedEntity
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever(); // UUID comes from the phone

        builder.HasOne(e => e.Patient)
            .WithMany(patientCollection)
            .HasForeignKey(e => e.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        // "Give me everything for this patient that changed since my last sync."
        builder.HasIndex(e => new { e.PatientId, e.ServerUpdatedAt });
    }
}
