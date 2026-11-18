using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Consulta y alta de pacientes (ESP-004).</summary>
public interface IPatientService
{
    /// <summary>Pacientes registrados, con el nombre de su diagnóstico si lo tienen.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default);

    /// <summary>Registra un paciente con el siguiente IdPaciente libre.</summary>
    /// <remarks>
    /// @pre solicitud cumple las reglas de <see cref="CreatePatientRequest"/>.
    /// @post Devuelve el paciente creado: ID nuevo, nombre limpio, sin diagnóstico.
    ///       Solo se guardan nombre y edad; las columnas de salida quedan en null.
    /// </remarks>
    Task<PatientSummary> RegistrarAsync(CreatePatientRequest solicitud, CancellationToken cancellationToken = default);
}
