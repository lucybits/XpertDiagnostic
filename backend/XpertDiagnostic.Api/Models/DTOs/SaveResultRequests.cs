using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>Diagnóstico que confirma el médico (una de las enfermedades de la base de conocimiento).</summary>
public class ConfirmDiagnosisRequest
{
    [Required, RegularExpression(@"^[A-Z]{5}\d{5}$")]
    public string IdEnfermedad { get; set; } = string.Empty;
}

/// <summary>Tratamiento indicado: uno de los de la enfermedad diagnosticada (decisión de Lucía, P-105).</summary>
public class ChooseTreatmentRequest
{
    [Required, StringLength(20, MinimumLength = 1)]
    public string IdTratamiento { get; set; } = string.Empty;
}

/// <summary>Plan escrito por el médico (decisión de Lucía, P-105); mismos límites que la tabla PLANES.</summary>
/// <remarks>@inv PlanIndicado de 3 a 1000 caracteres; Pronostico y Seguimiento hasta 300.</remarks>
public class SaveCarePlanRequest
{
    [Required, StringLength(1000, MinimumLength = 3)]
    public string PlanIndicado { get; set; } = string.Empty;

    [StringLength(300)]
    public string? Pronostico { get; set; }

    [StringLength(300)]
    public string? Seguimiento { get; set; }
}
