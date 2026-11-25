using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Máquina de inferencia (P-103). Recibe los hallazgos del paciente (entradas) y propone el diagnóstico
/// diferencial (salida). La implementación registrada es <c>InferenceEngine</c>, conversión del motor del
/// equipo (inference_engine.prg, P-160); no hay RAG ni servicio de IA aparte.
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
    /// @post Todas las enfermedades con al menos una coincidencia, una por nombre y en orden alfabético
    ///       (copia literal del .prg, P-161), cada una con su primer tratamiento si lo tiene. No modifica datos.
    /// @post No consulta IO_ResultadosEsperados (es solo para evaluar al sistema).
    /// </remarks>
    Task<IReadOnlyList<DiagnosisCandidate>> InferirAsync(
        IReadOnlyList<FindingView> hallazgos,
        CancellationToken cancellationToken = default);
}
