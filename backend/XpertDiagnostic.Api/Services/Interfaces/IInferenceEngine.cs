using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Máquina de inferencia (P-103). Recibe los hallazgos del paciente (entradas) y
/// propone el diagnóstico diferencial (salida). Hoy está registrada una implementación provisional;
/// cuando el equipo termine la máquina de inferencia (o el RAG), se registra la nueva en Program.cs
/// sin cambiar el servicio, el controlador ni el frontend.
/// </summary>
public interface IInferenceEngine
{
    /// <summary>Nombre corto de la implementación (se muestra junto al resultado).</summary>
    string Nombre { get; }

    /// <summary>true mientras sea una implementación de demostración.</summary>
    bool Provisional { get; }

    /// <summary>Diagnóstico diferencial a partir de los hallazgos.</summary>
    /// <remarks>
    /// @pre hallazgos son filas de HALLAZGOS_PACIENTE (sin agrupar), con su IdRegistro.
    /// @post Hasta 3 candidatos con al menos una coincidencia, de mayor a menor puntaje. No modifica datos.
    /// @post No consulta IO_ResultadosEsperados (es solo para evaluar al sistema).
    /// </remarks>
    Task<IReadOnlyList<DiagnosisCandidate>> InferirAsync(
        IReadOnlyList<FindingView> hallazgos,
        CancellationToken cancellationToken = default);
}
