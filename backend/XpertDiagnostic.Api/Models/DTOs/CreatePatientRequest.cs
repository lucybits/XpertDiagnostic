using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Datos con los que el administrador da de alta a un paciente (ESP-004, P-144); el ID lo asigna el
/// servidor. ASP.NET Core los valida antes de llegar al controlador (400 si no).
/// </summary>
/// <remarks>
/// @inv Nombres de 2 a 60 caracteres; ApellidoPaterno de 2 a 40; ApellidoMaterno vacío o de 2 a 40.
///      Todos con al menos una letra y sin dígitos (RF-31).
/// @inv FechaNacimiento no es futura y corresponde a una edad de 0 a 130 años.
/// @inv Sexo es exactamente "F" (mujer) o "M" (hombre): un carácter, nunca vacío. Se convierte a mayúscula
///      al recibirlo ("f" → "F") (CK_PACIENTES_SEXO).
/// </remarks>
public class CreatePatientRequest : IValidatableObject
{
    public const int EdadMaxima = 130;
    private const string SoloLetras = @"^(?=.*\p{L})[^\d]+$";

    [Required, StringLength(60, MinimumLength = 2)]
    [RegularExpression(SoloLetras)]
    public string Nombres { get; set; } = string.Empty;

    [Required, StringLength(40, MinimumLength = 2)]
    [RegularExpression(SoloLetras)]
    public string ApellidoPaterno { get; set; } = string.Empty;

    /// <summary>Opcional: hay personas con un solo apellido.</summary>
    [StringLength(40, MinimumLength = 2)]
    [RegularExpression(SoloLetras)]
    public string? ApellidoMaterno { get; set; }

    [Required]
    public DateOnly? FechaNacimiento { get; set; }

    /// <summary>"F" = mujer, "M" = hombre. Se convierte a mayúscula al recibirlo ("f" → "F").</summary>
    [Required, StringLength(1, MinimumLength = 1), RegularExpression("^[FM]$")]
    public string Sexo
    {
        get => _sexo;
        set => _sexo = value?.Trim().ToUpperInvariant() ?? string.Empty;
    }

    private string _sexo = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FechaNacimiento is not { } fecha) yield break;

        var hoy = DateOnly.FromDateTime(DateTime.Today);
        if (fecha > hoy)
            yield return new ValidationResult("La fecha de nacimiento no puede ser futura.", [nameof(FechaNacimiento)]);
        else if (fecha < hoy.AddYears(-EdadMaxima))
            yield return new ValidationResult($"La edad no puede pasar de {EdadMaxima} años.", [nameof(FechaNacimiento)]);
    }
}
