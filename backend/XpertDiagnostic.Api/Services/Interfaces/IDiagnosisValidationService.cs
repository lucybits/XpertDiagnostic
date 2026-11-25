using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Validación del diagnóstico por el médico internista (P-151). El médico tratante analiza y envía el
/// diagnóstico diferencial; el internista revisa los candidatos de la máquina de inferencia y confirma
/// uno, que pasa a ser la enfermedad diagnosticada del paciente. Al tratante le llega el resultado.
/// </summary>
public interface IDiagnosisValidationService
{
    /// <summary>El médico tratante envía el diagnóstico diferencial del paciente al internista.</summary>
    /// <remarks>
    /// @pre idTratante &gt; 0 (lo toma el controlador del token).
    /// @post Guardado: el paciente queda pendiente, con el tratante y la fecha. Se puede volver a enviar
    ///       (por ejemplo, tras corregir hallazgos); el diagnóstico confirmado anterior se conserva hasta
    ///       que el internista confirme el nuevo.
    /// @post SinCandidatos si el análisis actual no tiene candidatos; PacienteNoExiste si no existe.
    /// </remarks>
    Task<ValidationStatus> SolicitarAsync(string idPaciente, int idTratante, CancellationToken cancellationToken = default);

    /// <summary>Estado de la validación de un paciente.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<ValidationSummary?> ObtenerEstadoAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Pacientes pendientes o confirmados, para la pantalla del internista.</summary>
    /// <remarks>@pre estado es "P" o "C". @post No modifica datos.</remarks>
    Task<IReadOnlyList<ValidationSummary>> ListarAsync(string estado, CancellationToken cancellationToken = default);

    /// <summary>Paciente, hallazgos y diagnóstico diferencial actual, para que el internista decida.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<ValidationDetail?> ObtenerDetalleAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>El médico internista confirma uno de los candidatos, o corrige uno ya confirmado (error de dedo).</summary>
    /// <remarks>
    /// @pre idInternista &gt; 0 (lo toma el controlador del token).
    /// @post Guardado: la enfermedad queda como diagnosticada y la validación como confirmada, con el internista
    ///       y la fecha de esta confirmación. Si cambió de enfermedad, el tratamiento anterior se quita (ya no le
    ///       corresponde); si es la misma, se conserva.
    /// @post NoEnviado si el tratante no lo ha enviado; EnfermedadNoCandidata si la enfermedad no es uno de los
    ///       candidatos del análisis actual; PacienteNoExiste si no existe. En esos casos no guarda nada.
    /// </remarks>
    Task<ValidationStatus> ConfirmarAsync(string idPaciente, string idEnfermedad, int idInternista, CancellationToken cancellationToken = default);
}
