namespace MSCompanion.Data.Configurations;

internal static class CheckConstraintSql
{
    public static string OneOf<TEnum>(string column)
        where TEnum : struct, Enum
        => $"{column} IN ({string.Join(", ", Enum.GetNames<TEnum>().Select(name => $"'{name}'"))})";
}
