using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Expediente capturado de un paciente: enfermedad preexistente y HALLAZGOS_PACIENTE.</summary>
public interface IPatientRecordRepository
{
    /// <remarks>@post true si el paciente existe. No modifica datos.</remarks>
    Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Enfermedad preexistente (ID y nombre) del paciente, o (null, null) si no tiene.</summary>
    /// <remarks>@pre el paciente existe. @post No modifica datos.</remarks>
    Task<(string? Id, string? Nombre)> ObtenerPreexistenteAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Hallazgos del paciente con la descripción de su catálogo.</summary>
    /// <remarks>@post Uno por fila de HALLAZGOS_PACIENTE (sin agrupar). No modifica datos.</remarks>
    Task<IReadOnlyList<FindingView>> ListarHallazgosAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Reemplaza todos los hallazgos de un tipo por los indicados, en una transacción.</summary>
    /// <remarks>
    /// @pre todos los hallazgos son del paciente y del tipo indicados, sin IdRegistro repetido.
    /// @post Quedan exactamente esos hallazgos de ese tipo; los de otros tipos no cambian.
    /// </remarks>
    Task ReemplazarHallazgosAsync(
        string idPaciente,
        string tipoHallazgo,
        IReadOnlyList<PatientFinding> hallazgos,
        CancellationToken cancellationToken = default);

    /// <summary>Asigna (o quita, con null) la enfermedad preexistente.</summary>
    /// <remarks>@pre el paciente existe y idEnfermedad es null o existe en ENFERMEDADES.</remarks>
    Task AsignarPreexistenteAsync(string idPaciente, string? idEnfermedad, CancellationToken cancellationToken = default);
}
