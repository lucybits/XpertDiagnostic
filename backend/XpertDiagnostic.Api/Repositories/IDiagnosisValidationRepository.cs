using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Columnas de validación de un paciente tal como están guardadas (P-151).</summary>
public sealed record ValidationRow(
    string? EstadoValidacion,
    string? IdEnfermedadDiagnosticada,
    string? IdTratamiento);

/// <summary>Validación del diagnóstico por el médico internista: columnas de validación de PACIENTES.</summary>
public interface IDiagnosisValidationRepository
{
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<ValidationRow?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Estado de la validación de un paciente con nombres de médicos y diagnóstico.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<ValidationSummary?> ObtenerResumenAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Pacientes en el estado indicado: los pendientes, del envío más antiguo al más reciente; los confirmados, del más reciente al más antiguo.</summary>
    /// <remarks>@pre estado es ValidationStates.Pendiente o ValidationStates.Confirmado. @post No modifica datos.</remarks>
    Task<IReadOnlyList<ValidationSummary>> ListarAsync(string estado, CancellationToken cancellationToken = default);

    /// <summary>Marca al paciente como pendiente de validación, enviado por el tratante.</summary>
    /// <remarks>
    /// @pre el paciente existe.
    /// @post EstadoValidacion = P, con solicitante y fecha; se borra el validador y la fecha de validación.
    ///       La enfermedad diagnosticada anterior, si había, se conserva hasta que el internista confirme otra.
    /// </remarks>
    Task SolicitarAsync(string idPaciente, int idTratante, DateTime fechaUtc, CancellationToken cancellationToken = default);

    /// <summary>Guarda el diagnóstico confirmado por el internista y marca la validación como confirmada.</summary>
    /// <remarks>
    /// @pre el paciente existe y la enfermedad es uno de los candidatos.
    /// @post EstadoValidacion = C; IdEnfermedadDiagnosticada = idEnfermedad; IdTratamiento = idTratamiento
    ///       (null lo quita); validador y fecha guardados. Todo en una sola actualización.
    /// </remarks>
    Task ConfirmarAsync(
        string idPaciente,
        string idEnfermedad,
        string? idTratamiento,
        int idInternista,
        DateTime fechaUtc,
        CancellationToken cancellationToken = default);
}
