using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Columnas de salida de un paciente tal como están guardadas.</summary>
public sealed record PatientOutputRow(
    PatientSummary Paciente,
    string? IdEnfermedadDiagnosticada,
    string? EnfermedadDiagnosticada,
    string? IdTratamiento,
    string? IdPlan);

/// <summary>Salidas del expediente: diagnóstico, tratamiento y plan (columnas de salida de PACIENTES y PLANES).</summary>
public interface IPatientResultRepository
{
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <remarks>@post true si la enfermedad existe en ENFERMEDADES. No modifica datos.</remarks>
    Task<bool> ExisteEnfermedadAsync(string idEnfermedad, CancellationToken cancellationToken = default);

    /// <summary>Tratamientos de la enfermedad, ordenados por ID.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<TreatmentView>> ListarTratamientosAsync(string idEnfermedad, CancellationToken cancellationToken = default);

    /// <remarks>@post null si no existe. No modifica datos.</remarks>
    Task<CarePlanView?> ObtenerPlanAsync(string idPlan, CancellationToken cancellationToken = default);

    /// <summary>Guarda la enfermedad diagnosticada y el tratamiento (null para quitarlo).</summary>
    /// <remarks>@pre el paciente y la enfermedad existen; el tratamiento, si viene, es de esa enfermedad.</remarks>
    Task AsignarDiagnosticoAsync(string idPaciente, string idEnfermedad, string? idTratamiento, CancellationToken cancellationToken = default);

    /// <summary>Guarda el tratamiento indicado.</summary>
    /// <remarks>@pre el paciente existe y el tratamiento es de su enfermedad diagnosticada.</remarks>
    Task AsignarTratamientoAsync(string idPaciente, string idTratamiento, CancellationToken cancellationToken = default);

    /// <remarks>@post El mayor IdPlan con formato PLAN_ + dígitos, o null. No modifica datos.</remarks>
    Task<string?> ObtenerUltimoIdPlanAsync(CancellationToken cancellationToken = default);

    /// <summary>Crea el plan y lo asigna al paciente en una transacción.</summary>
    /// <remarks>@post true si se guardó; false si el IdPlan ya existía (no se guardó nada).</remarks>
    Task<bool> CrearPlanAsync(string idPaciente, CarePlan plan, CancellationToken cancellationToken = default);

    /// <summary>Actualiza el texto de un plan existente.</summary>
    /// <remarks>@pre el plan existe.</remarks>
    Task ActualizarPlanAsync(CarePlan plan, CancellationToken cancellationToken = default);
}
