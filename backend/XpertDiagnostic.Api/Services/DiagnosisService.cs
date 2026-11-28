using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Lee los hallazgos del paciente y se los pasa a la máquina de inferencia registrada. No sabe qué
/// implementación es (inversión de dependencias, la D de SOLID): cambiar de motor no cambia esta clase.
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class DiagnosisService(IPatientRecordRepository expedientes, IInferenceEngine motor) : IDiagnosisService
{
    private readonly IPatientRecordRepository _expedientes = expedientes ?? throw new ArgumentNullException(nameof(expedientes));
    private readonly IInferenceEngine _motor = motor ?? throw new ArgumentNullException(nameof(motor));

    public async Task<DiagnosisResult?> AnalizarAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        if (!await _expedientes.ExistePacienteAsync(idPaciente, cancellationToken))
            return null;

        var hallazgos = await _expedientes.ListarHallazgosAsync(idPaciente, cancellationToken);
        var candidatos = await _motor.InferirAsync(hallazgos, cancellationToken);
        return new DiagnosisResult(_motor.Nombre, candidatos);
    }
}
