using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Expediente capturado de un paciente: HALLAZGOS_PACIENTE.</summary>
public interface IPatientRecordRepository
{
    /// <remarks>@post true si el paciente existe. No modifica datos.</remarks>
    Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default);

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

}
