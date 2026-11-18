using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Análisis de un paciente con la máquina de inferencia registrada (P-103).</summary>
public interface IDiagnosisService
{
    /// <summary>Diagnóstico diferencial a partir de los hallazgos guardados del paciente.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<DiagnosisResult?> AnalizarAsync(string idPaciente, CancellationToken cancellationToken = default);
}
