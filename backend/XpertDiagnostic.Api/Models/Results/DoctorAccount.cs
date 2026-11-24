namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Médico con el estado de su cuenta, tal como lo ve el panel de administración.</summary>
/// <remarks>
/// @inv IdMedico == ID de inicio de sesión del médico. Nunca incluye la contraseña ni su hash.
/// @inv Rol es "T" (tratante) o "I" (internista).
/// </remarks>
public sealed record DoctorAccount(
    int IdMedico,
    string NombreCompleto,
    string Especialidad,
    string CedulaProfesional,
    string Rol,
    bool Activo,
    DateTime FechaRegistro);

public enum DoctorUpdateStatus
{
    Actualizado,
    NoEncontrado,
    CedulaDuplicada
}

/// <summary>Resultado de editar los datos de un médico.</summary>
/// <remarks>@inv Cuenta != null si y solo si Estado == Actualizado.</remarks>
public sealed record DoctorUpdateResult(DoctorUpdateStatus Estado, DoctorAccount? Cuenta)
{
    public static DoctorUpdateResult Actualizado(DoctorAccount cuenta) => new(DoctorUpdateStatus.Actualizado, cuenta);
    public static readonly DoctorUpdateResult NoEncontrado = new(DoctorUpdateStatus.NoEncontrado, null);
    public static readonly DoctorUpdateResult CedulaDuplicada = new(DoctorUpdateStatus.CedulaDuplicada, null);
}

/// <summary>Rol y estado de una cuenta: lo que se revisa en cada petición autenticada.</summary>
public sealed record UserAccess(string Rol, bool Activo);
