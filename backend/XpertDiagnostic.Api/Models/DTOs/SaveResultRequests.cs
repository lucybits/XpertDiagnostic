using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>Diagnóstico que confirma el médico internista: uno de los candidatos del análisis (P-151).</summary>
public class ConfirmDiagnosisRequest
{
    [Required, RegularExpression(@"^[A-Z]{5}\d{5}$")]
    public string IdEnfermedad { get; set; } = string.Empty;
}
