using XpertDiagnostic.Api.Models.Entities;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Interrogatorio del paciente (P-159): IO_AntecNoPatolPacientes e IO_AntecPatolPacientes.</summary>
public interface IPatientHistoryRepository
{
    /// <remarks>@post true si el paciente existe. No modifica datos.</remarks>
    Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <remarks>@post Los antecedentes no patológicos guardados, o null. No modifica datos.</remarks>
    Task<NonPathologicalHistory?> ObtenerNoPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <remarks>@post Los antecedentes patológicos guardados, o null. No modifica datos.</remarks>
    Task<PathologicalHistory?> ObtenerPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Crea o reemplaza los antecedentes no patológicos del paciente.</summary>
    /// <remarks>@pre el paciente existe. @post queda una sola fila del paciente con estos valores.</remarks>
    Task GuardarNoPatologicosAsync(NonPathologicalHistory antecedentes, CancellationToken cancellationToken = default);

    /// <summary>Crea o reemplaza los antecedentes patológicos del paciente.</summary>
    /// <remarks>@pre el paciente existe. @post queda una sola fila del paciente con estos valores.</remarks>
    Task GuardarPatologicosAsync(PathologicalHistory antecedentes, CancellationToken cancellationToken = default);
}
