using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Datos para registrar a un médico y crear su cuenta desde el panel de administración.
/// ASP.NET Core los valida antes de llegar al controlador; si no cumplen, responde 400.
/// La cuenta siempre se crea con rol de médico (P-116): el panel no crea administradores.
/// </summary>
/// <remarks>
/// @inv IdMedico entre 1 e int.MaxValue; también será el ID de inicio de sesión.
/// @inv NombreCompleto de 3 a 120 caracteres; Especialidad de 2 a 80.
/// @inv CedulaProfesional de 7 u 8 dígitos.
/// @inv Password de 8 a 72 caracteres (72 es el límite de BCrypt).
/// @inv Rol es "T" (tratante) o "I" (internista) (P-144).
/// </remarks>
public class CreateDoctorRequest
{
    [Range(1, int.MaxValue)]
    public int IdMedico { get; set; }

    [Required, StringLength(120, MinimumLength = 3)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required, StringLength(80, MinimumLength = 2)]
    public string Especialidad { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{7,8}$")]
    public string CedulaProfesional { get; set; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Indica el tipo de médico.")]
    [RegularExpression("^[TI]$", ErrorMessage = "El tipo de médico debe ser T (tratante) o I (internista).")]
    public string Rol { get; set; } = string.Empty;
}
