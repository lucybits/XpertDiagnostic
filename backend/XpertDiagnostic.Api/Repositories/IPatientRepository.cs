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

    /// <summary>Guarda el paciente (solo sus datos de alta, P-144).</summary>
    /// <remarks>
    /// @pre paciente.Id no está vacío.
    /// @post true si se guardó; false si el ID ya existía (no se guardó nada).
    /// </remarks>
    Task<bool> CrearAsync(Patient paciente, CancellationToken cancellationToken = default);

    /// <summary>Borra de forma definitiva al paciente y todo su expediente (P-144).</summary>
    /// <remarks>
    /// @post true si existía: en una sola transacción se borran sus hallazgos, atenciones, antecedentes
    ///       (IO_Antec*Pacientes), resultado esperado (IO_ResultadosEsperados), la marca en IO_Complicaciones,
    ///       el paciente y su plan (PLANES) si ningún otro paciente lo usa. false si no existía (no se borra nada).
    /// </remarks>
    Task<bool> EliminarAsync(string idPaciente, CancellationToken cancellationToken = default);
}
