using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Acceso a datos de pacientes (tabla PACIENTES).</summary>
public interface IPatientRepository
{
    /// <summary>Todos los pacientes con el nombre de su diagnóstico, ordenados por ID.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default);

    /// <summary>El mayor IdPaciente con formato PACIE + dígitos, o null si no hay ninguno.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<string?> ObtenerUltimoIdAsync(CancellationToken cancellationToken = default);

    /// <summary>Guarda el paciente y sus antecedentes no patológicos en una sola operación.</summary>
    /// <remarks>
    /// @pre paciente.Id no está vacío y antecedentes.IdPaciente == paciente.Id.
    /// @post true si se guardaron ambos; false si el ID ya existía (no se guardó nada).
    /// </remarks>
    Task<bool> CrearAsync(Patient paciente, NonPathologicalHistory antecedentes, CancellationToken cancellationToken = default);
}
