using System.ComponentModel.DataAnnotations;
using XpertDiagnostic.Api.Models;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Datos para registrar un paciente (ESP-004). Solo lo que el médico conoce al abrir el expediente;
/// el ID lo asigna el servidor. ASP.NET Core los valida antes de llegar al controlador (400 si no).
/// </summary>
/// <remarks>
/// @inv NombreCompleto de 3 a 150 caracteres, con al menos una letra y sin dígitos (RF-31).
/// @inv FechaNacimiento no es futura y da una edad de 0 a 130 años (CK_PACIENTES_EDAD).
/// @inv Sexo es exactamente "F" (mujer) o "M" (hombre): un carácter, en mayúscula, nunca vacío (CK_PACIENTES_SEXO).
/// </remarks>
public class CreatePatientRequest : IValidatableObject
{
    [Required, StringLength(150, MinimumLength = 3)]
    [RegularExpression(@"^(?=.*\p{L})[^\d]+$")]
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Fecha de nacimiento (JSON "AAAA-MM-DD"); la edad se calcula a partir de ella.</summary>
    public DateOnly FechaNacimiento { get; set; }

    /// <summary>"F" = mujer, "M" = hombre. Se convierte a mayúscula al recibirlo ("f" → "F").</summary>
    [Required, StringLength(1, MinimumLength = 1), RegularExpression("^[FM]$")]
    public string Sexo
    {
        get => _sexo;
        set => _sexo = value?.Trim().ToUpperInvariant() ?? string.Empty;
    }

    private string _sexo = string.Empty;

    // ── Antecedentes no patológicos (IO_AntecNoPatolPacientes): casillas sí/no; sin marcar = no ──

    /// <summary>¿Fuma? → Tabaquismo.</summary>
    public bool Tabaquismo { get; set; }

    /// <summary>¿Consume alcohol? → Alcoholism.</summary>
    public bool Alcoholismo { get; set; }

    /// <summary>¿Consume drogas? → Toxicomans.</summary>
    public bool Toxicomanias { get; set; }

    /// <summary>¿Exposición a humo de leña o biomasa? → Biomasa.</summary>
    public bool Biomasa { get; set; }

    /// <summary>¿Tatuajes o perforaciones? → TatuajPerf.</summary>
    public bool TatuajesPerforaciones { get; set; }

    /// <summary>¿Usa herbolaria? → Herbolaria.</summary>
    public bool Herbolaria { get; set; }

    /// <summary>¿Ha recibido transfusiones? → Transfusio.</summary>
    public bool Transfusiones { get; set; }

    /// <summary>La fecha de nacimiento debe dar una edad válida hoy (usa el TimeProvider del servidor si lo hay).</summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var reloj = validationContext.GetService(typeof(TimeProvider)) as TimeProvider ?? TimeProvider.System;
        var edad = EdadPaciente.Calcular(FechaNacimiento, EdadPaciente.Hoy(reloj));
        if (edad < 0 || edad > EdadPaciente.Maxima)
            yield return new ValidationResult(
                $"La fecha de nacimiento debe dar una edad de 0 a {EdadPaciente.Maxima} años.",
                [nameof(FechaNacimiento)]);
    }
}
