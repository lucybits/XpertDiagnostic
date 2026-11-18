namespace XpertDiagnostic.Api.Models.Results;

public enum DoctorRegistrationStatus
{
    Creado,
    IdDuplicado,
    CedulaDuplicada
}

/// <summary>Resultado del alta de un médico con su cuenta.</summary>
/// <remarks>@inv Cuenta != null si y solo si Estado == Creado.</remarks>
public sealed record DoctorRegistrationResult(DoctorRegistrationStatus Estado, DoctorAccount? Cuenta)
{
    public static DoctorRegistrationResult Creado(DoctorAccount cuenta) => new(DoctorRegistrationStatus.Creado, cuenta);
    public static readonly DoctorRegistrationResult IdDuplicado = new(DoctorRegistrationStatus.IdDuplicado, null);
    public static readonly DoctorRegistrationResult CedulaDuplicada = new(DoctorRegistrationStatus.CedulaDuplicada, null);
}
