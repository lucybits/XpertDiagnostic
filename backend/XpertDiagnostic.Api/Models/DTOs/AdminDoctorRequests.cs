using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>Datos editables de un médico (el ID no cambia: es la llave y su usuario de acceso).</summary>
/// <remarks>
/// @inv NombreCompleto de 3 a 120 caracteres; Especialidad de 2 a 80; CedulaProfesional de 7 u 8 dígitos.
/// </remarks>
public class UpdateDoctorRequest
{
    [Required, StringLength(120, MinimumLength = 3)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required, StringLength(80, MinimumLength = 2)]
    public string Especialidad { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{7,8}$")]
    public string CedulaProfesional { get; set; } = string.Empty;
}

/// <summary>Contraseña nueva que el administrador asigna a un médico.</summary>
/// <remarks>@inv Password de 8 a 72 caracteres.</remarks>
public class ResetPasswordRequest
{
    [Required, StringLength(72, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

/// <summary>Activa o desactiva la cuenta de un médico.</summary>
public class UpdateAccountStatusRequest
{
    [Required]
    public bool? Activo { get; set; }
}

/// <summary>Cambio de la contraseña propia (requiere la actual).</summary>
/// <remarks>
/// @inv PasswordActual de 1 a 72 caracteres; PasswordNueva de 8 a 72.
/// </remarks>
public class ChangePasswordRequest
{
    [Required, StringLength(72, MinimumLength = 1)]
    public string PasswordActual { get; set; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string PasswordNueva { get; set; } = string.Empty;
}
