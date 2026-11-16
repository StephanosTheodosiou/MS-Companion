using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<SymptomCheckin> SymptomCheckins => Set<SymptomCheckin>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationSchedule> MedicationSchedules => Set<MedicationSchedule>();
    public DbSet<MedicationIntake> MedicationIntakes => Set<MedicationIntake>();
    public DbSet<SideEffect> SideEffects => Set<SideEffect>();
    public DbSet<BloodTestReminder> BloodTestReminders => Set<BloodTestReminder>();
    public DbSet<RelapseLogEntry> RelapseLogEntries => Set<RelapseLogEntry>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<VisitQuestion> VisitQuestions => Set<VisitQuestion>();
    public DbSet<VisitReport> VisitReports => Set<VisitReport>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Category enums are stored as readable text, so reordering an enum can never silently change
        // stored data. SymptomScore (smallint 0–4) and Weekdays (int bit mask) are deliberately numbers.
        StoreAsText<MsType>(configurationBuilder);
        StoreAsText<ConsentDataType>(configurationBuilder);
        StoreAsText<MedicationStatus>(configurationBuilder);
        StoreAsText<IntakeStatus>(configurationBuilder);
        StoreAsText<SideEffectSeverity>(configurationBuilder);
        StoreAsText<RelapseGuidance>(configurationBuilder);
        StoreAsText<AppointmentType>(configurationBuilder);
    }

    private static void StoreAsText<TEnum>(ModelConfigurationBuilder configurationBuilder)
        where TEnum : struct, Enum
        => configurationBuilder.Properties<TEnum>().HaveConversion<string>().HaveMaxLength(40);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Applies every IEntityTypeConfiguration<T> in MSCompanion.Data/Configurations.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Hide soft-deleted rows from normal queries.
        // The sync "pull" endpoint must use .IgnoreQueryFilters() so tombstones reach the phone.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(t => typeof(PatientOwnedEntity).IsAssignableFrom(t.ClrType)))
        {
            var e = Expression.Parameter(entityType.ClrType, "e");
            var isLive = Expression.Equal(
                Expression.Property(e, nameof(PatientOwnedEntity.DeletedAt)),
                Expression.Constant(null, typeof(DateTimeOffset?)));
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(Expression.Lambda(isLive, e));
        }
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        StampAndGuard();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        StampAndGuard();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// - Server-owned audit fields on <see cref="AuditableEntity"/> (users).
    /// - Sync cursor (<see cref="SyncedEntity.ServerUpdatedAt"/>) on every synced write, plus device timestamps
    ///   for rows created on the server.
    /// - Consent records are append-only.
    /// </summary>
    private void StampAndGuard()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now.UtcDateTime;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now.UtcDateTime;
            }
        }

        foreach (var entry in ChangeTracker.Entries<SyncedEntity>())
        {
            if (entry.Entity is ConsentRecord && entry.State == EntityState.Modified)
            {
                throw new InvalidOperationException(
                    "Consent records are append-only. Add a new ConsentRecord instead of changing an existing one.");
            }

            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            entry.Entity.ServerUpdatedAt = now;

            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = now;
                if (entry.Entity.UpdatedAt == default) entry.Entity.UpdatedAt = entry.Entity.CreatedAt;
            }
        }
    }
}
