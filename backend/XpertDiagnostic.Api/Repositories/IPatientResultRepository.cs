using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Columnas de salida de un paciente tal como están guardadas.</summary>
public sealed record PatientOutputRow(
    PatientSummary Paciente,
    string? IdEnfermedadDiagnosticada,
    string? EnfermedadDiagnosticada,
    string? IdTratamiento,
    string? IdPlan,
    DateTime? FechaValidacion = null);

/// <summary>
/// Salidas del expediente: diagnóstico, tratamiento y plan (columnas de salida de PACIENTES y PLANES).
/// Solo lectura (P-164).
/// </summary>
public interface IPatientResultRepository
{
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Tratamientos de la enfermedad, ordenados por ID.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<TreatmentView>> ListarTratamientosAsync(string idEnfermedad, CancellationToken cancellationToken = default);

    /// <remarks>@post null si no existe. No modifica datos.</remarks>
    Task<CarePlanView?> ObtenerPlanAsync(string idPlan, CancellationToken cancellationToken = default);
}
