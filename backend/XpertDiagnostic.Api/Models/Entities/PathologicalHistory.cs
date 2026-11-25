using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Antecedentes patológicos de un paciente (tabla <c>IO_AntecPatolPacientes</c>), uno por paciente. Los
/// captura el médico tratante en el interrogatorio (P-159). Cada campo es texto libre; null = sin registrar.
/// Los nombres de las propiedades son los de las columnas. La relación con PACIENTES se declara en
/// <c>AppDbContext</c>.
/// </summary>
/// <remarks>@inv IdPaciente existe en PACIENTES. @inv Cada texto mide como máximo 255 caracteres.</remarks>
[Table("IO_AntecPatolPacientes")]
public class PathologicalHistory
{
    [Key]
    [Column("Id_Paciente", TypeName = "varchar(10)")]
    public string IdPaciente { get; set; } = string.Empty;

    [StringLength(255)] public string? Alergias { get; set; }
    [StringLength(255)] public string? CroniDegen { get; set; }
    [StringLength(255)] public string? Endocrinol { get; set; }
    [StringLength(255)] public string? Pulmonar { get; set; }
    [StringLength(255)] public string? Cardiologic { get; set; }
    [StringLength(255)] public string? Dislipidem { get; set; }
    [StringLength(255)] public string? Dermatolog { get; set; }
    [StringLength(255)] public string? Neurologic { get; set; }
    [StringLength(255)] public string? Reumatolog { get; set; }
    [StringLength(255)] public string? Otorrinola { get; set; }
    [StringLength(255)] public string? Neumologic { get; set; }
    [StringLength(255)] public string? Psiquiatri { get; set; }
    [StringLength(255)] public string? Gastrointe { get; set; }
    [StringLength(255)] public string? Osteomuscu { get; set; }
    [StringLength(255)] public string? UroloRenal { get; set; }
    [StringLength(255)] public string? Oftalmolog { get; set; }
    [StringLength(255)] public string? Infectolog { get; set; }
    [StringLength(255)] public string? Hematologi { get; set; }
    [StringLength(255)] public string? Oncologico { get; set; }
    [StringLength(255)] public string? Ginecologi { get; set; }
    [StringLength(255)] public string? Traumatism { get; set; }
}
