using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Antecedentes no patológicos (IO_AntecNoPatolPacientes): siete preguntas sí/no del interrogatorio
/// (P-159). Se usa para guardar y para devolver.
/// </summary>
/// <remarks>@inv Las siete respuestas vienen siempre (true = sí, false = no).</remarks>
public sealed class NonPathologicalHistoryData
{
    [Required] public bool? Tabaquismo { get; set; }
    [Required] public bool? Alcoholismo { get; set; }
    [Required] public bool? Toxicomanias { get; set; }
    [Required] public bool? Biomasa { get; set; }
    [Required] public bool? TatuajesPerforaciones { get; set; }
    [Required] public bool? Herbolaria { get; set; }
    [Required] public bool? Transfusiones { get; set; }
}

/// <summary>
/// Antecedentes patológicos (IO_AntecPatolPacientes): veintiún campos de texto libre del interrogatorio
/// (P-159). Vacío o solo espacios = sin registrar. Se usa para guardar y para devolver.
/// </summary>
/// <remarks>@inv Cada texto mide como máximo 255 caracteres (columna NVARCHAR(255)).</remarks>
public sealed class PathologicalHistoryData
{
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
