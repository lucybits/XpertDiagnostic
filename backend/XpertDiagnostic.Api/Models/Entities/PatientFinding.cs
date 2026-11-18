using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Hallazgo de un paciente (tabla <c>HALLAZGOS_PACIENTE</c>): entrada de la máquina de inferencia.
/// La llave es (IdPaciente, IdRegistro); se declara en <c>AppDbContext</c>.
/// </summary>
/// <remarks>
/// @inv TipoHallazgo es Sintoma, Signo, Complicacion, Estudio_lab, Estudio_diagdif o Comorbilidad.
/// @inv IdRegistro existe en el catálogo que indica TipoHallazgo.
/// @inv Valor es "presente" o una medición en texto (máx. 50 caracteres).
/// </remarks>
[Table("HALLAZGOS_PACIENTE")]
public class PatientFinding
{
    [Column(TypeName = "varchar(10)")]
    public string IdPaciente { get; set; } = string.Empty;

    [Column(TypeName = "varchar(20)")]
    public string TipoHallazgo { get; set; } = string.Empty;

    [Column(TypeName = "varchar(20)")]
    public string IdRegistro { get; set; } = string.Empty;

    [StringLength(50)]
    public string Valor { get; set; } = FindingValues.Presente;

    [StringLength(30)]
    public string? Unidades { get; set; }
}

/// <summary>Valores y tipos de hallazgo que admite la tabla.</summary>
public static class FindingValues
{
    public const string Presente = "presente";

    public const string Sintoma = "Sintoma";
    public const string Signo = "Signo";
    public const string EstudioLaboratorio = "Estudio_lab";
    public const string Comorbilidad = "Comorbilidad";
}
