using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

/// <summary>
/// Table/column rules for <see cref="User"/>. Table and column names are snake_case automatically
/// (UseSnakeCaseNamingConvention in Program.cs), so this table is "users".
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever(); // generated in code (Guid v7)

        builder.Property(u => u.Email).HasMaxLength(256);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.PasswordHash).HasMaxLength(100);
        builder.Property(u => u.FirstName).HasMaxLength(100);
        builder.Property(u => u.LastName).HasMaxLength(100);

        // Store the enum as readable text ("User", "Admin") instead of a magic number.
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(32);
    }
}
