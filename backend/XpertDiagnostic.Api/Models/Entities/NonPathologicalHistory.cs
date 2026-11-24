using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Antecedentes no patológicos de un paciente (tabla <c>IO_AntecNoPatolPacientes</c>), uno por paciente.
/// Se guardan al registrar al paciente (casillas sí/no del alta).
/// La relación con PACIENTES se declara en <c>AppDbContext</c>.
/// </summary>
/// <remarks>@inv IdPaciente existe en PACIENTES.</remarks>
[Table("IO_AntecNoPatolPacientes")]
public class NonPathologicalHistory
{
    [Key]
    [Column(TypeName = "varchar(10)")]
    public string IdPaciente { get; set; } = string.Empty;

    /// <summary>¿Fuma?</summary>
    public bool Tabaquismo { get; set; }

    /// <summary>¿Consume alcohol? Null si no se ha preguntado.</summary>
    public bool? Alcoholism { get; set; }

    public bool? Toxicomans { get; set; }

    /// <summary>Exposición a humo de leña o biomasa: 1 sí, 0 no (la columna es INT).</summary>
    public int? Biomasa { get; set; }

    public bool? TatuajPerf { get; set; }

    public bool? Herbolaria { get; set; }

    public bool? Transfusio { get; set; }
}
