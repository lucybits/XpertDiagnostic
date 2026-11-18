using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Datos para registrar un paciente (ESP-004). Solo lo que el médico conoce al abrir el expediente;
/// el ID lo asigna el servidor. ASP.NET Core los valida antes de llegar al controlador (400 si no).
/// </summary>
/// <remarks>
/// @inv NombreCompleto de 3 a 150 caracteres, con al menos una letra y sin dígitos (RF-31).
/// @inv Edad entre 0 y 130 (CK_PACIENTES_EDAD).
/// </remarks>
public class CreatePatientRequest
{
    [Required, StringLength(150, MinimumLength = 3)]
    [RegularExpression(@"^(?=.*\p{L})[^\d]+$")]
    public string NombreCompleto { get; set; } = string.Empty;

    [Range(0, 130)]
    public int Edad { get; set; }
}
