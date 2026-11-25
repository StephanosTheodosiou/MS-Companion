namespace MSCompanion.Api.Interfaces;

public enum ServiceError
{
    PatientNotFound,
    ConsentRequired,
    NotFound,
    AlreadyLogged,
    AlreadyCompleted,
    DateInFuture,
    IncorrectPassword,
}

public readonly record struct ServiceResult<T>(T? Value, ServiceError? Error)
{
    public static implicit operator ServiceResult<T>(T value) => new(value, null);

    public static implicit operator ServiceResult<T>(ServiceError error) => new(default, error);
}
