using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Hallazgos de una sección (síntomas, signos, estudios o comorbilidades) tal como quedaron al
/// guardarla. Reemplaza los que hubiera de ese tipo (P-103).
/// </summary>
/// <remarks>@inv Hasta 100 elementos; cada uno con un IdRegistro del catálogo de la sección.</remarks>
public class SaveFindingsRequest
{
    [Required, MaxLength(100)]
    public List<FindingInput> Hallazgos { get; set; } = [];
}

/// <summary>Un hallazgo elegido del catálogo, con su medición si la tiene.</summary>
/// <remarks>
/// @inv IdRegistro de 1 a 20 caracteres.
/// @inv Valor null significa "presente"; si viene, es un número (p. ej. "38.5").
/// </remarks>
public class FindingInput
{
    [Required, StringLength(20, MinimumLength = 1)]
    public string IdRegistro { get; set; } = string.Empty;

    [RegularExpression(@"^-?\d{1,9}(\.\d{1,3})?$")]
    public string? Valor { get; set; }
}

/// <summary>Enfermedad preexistente del paciente (una sola, columna de PACIENTES), o null para quitarla.</summary>
public class SetPreexistingDiseaseRequest
{
    [StringLength(10, MinimumLength = 1)]
    public string? IdEnfermedad { get; set; }
}
