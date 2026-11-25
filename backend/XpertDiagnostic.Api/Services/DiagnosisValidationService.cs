using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Validación del diagnóstico por el médico internista (P-151). Los candidatos los da la máquina de
/// inferencia registrada (por ahora la provisional): el servicio no sabe cuál es, solo usa
/// <see cref="IDiagnosisService"/>. Así, cuando llegue la máquina del equipo, este flujo no cambia.
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class DiagnosisValidationService(
    IDiagnosisValidationRepository validaciones,
    IDiagnosisService diagnosticos,
    IPatientRecordService expedientes,
    TimeProvider reloj) : IDiagnosisValidationService
{
    private readonly IDiagnosisValidationRepository _validaciones = validaciones ?? throw new ArgumentNullException(nameof(validaciones));
    private readonly IDiagnosisService _diagnosticos = diagnosticos ?? throw new ArgumentNullException(nameof(diagnosticos));
    private readonly IPatientRecordService _expedientes = expedientes ?? throw new ArgumentNullException(nameof(expedientes));
    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));

    public async Task<ValidationStatus> SolicitarAsync(string idPaciente, int idTratante, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idTratante);

        var analisis = await _diagnosticos.AnalizarAsync(idPaciente, cancellationToken);
        if (analisis is null) return ValidationStatus.PacienteNoExiste;
        if (analisis.Candidatos.Count == 0) return ValidationStatus.SinCandidatos;

        await _validaciones.SolicitarAsync(idPaciente, idTratante, Ahora(), cancellationToken);
        return ValidationStatus.Guardado;
    }

    public Task<ValidationSummary?> ObtenerEstadoAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        return _validaciones.ObtenerResumenAsync(idPaciente, cancellationToken);
    }

    public Task<IReadOnlyList<ValidationSummary>> ListarAsync(string estado, CancellationToken cancellationToken = default)
    {
        if (!ValidationStates.EsValido(estado))
            throw new ArgumentOutOfRangeException(nameof(estado), estado, "El estado debe ser P o C.");
        return _validaciones.ListarAsync(estado, cancellationToken);
    }

    public async Task<ValidationDetail?> ObtenerDetalleAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);

        var resumen = await _validaciones.ObtenerResumenAsync(idPaciente, cancellationToken);
        if (resumen is null) return null;

        var expediente = await _expedientes.ObtenerAsync(idPaciente, cancellationToken);
        var analisis = await _diagnosticos.AnalizarAsync(idPaciente, cancellationToken);
        if (expediente is null || analisis is null) return null; // Se eliminó mientras tanto.
        return new ValidationDetail(resumen, expediente, analisis);
    }

    public async Task<ValidationStatus> ConfirmarAsync(
        string idPaciente,
        string idEnfermedad,
        int idInternista,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentException.ThrowIfNullOrWhiteSpace(idEnfermedad);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idInternista);

        var fila = await _validaciones.ObtenerAsync(idPaciente, cancellationToken);
        if (fila is null) return ValidationStatus.PacienteNoExiste;
        // Se confirma lo pendiente y también se corrige lo ya confirmado (por ejemplo, un error de dedo);
        // lo que el tratante no ha enviado no se toca.
        if (!ValidationStates.EsValido(fila.EstadoValidacion)) return ValidationStatus.NoEnviado;

        // Solo se confirma lo que propuso la máquina de inferencia con los hallazgos actuales.
        var analisis = await _diagnosticos.AnalizarAsync(idPaciente, cancellationToken);
        if (analisis is null) return ValidationStatus.PacienteNoExiste;
        if (!analisis.Candidatos.Any(c => c.IdEnfermedad == idEnfermedad)) return ValidationStatus.EnfermedadNoCandidata;

        // El tratamiento elegido solo sigue si es de la misma enfermedad.
        var tratamiento = fila.IdEnfermedadDiagnosticada == idEnfermedad ? fila.IdTratamiento : null;
        await _validaciones.ConfirmarAsync(idPaciente, idEnfermedad, tratamiento, idInternista, Ahora(), cancellationToken);
        return ValidationStatus.Guardado;
    }

    /// <summary>Hora actual en UTC sin fracciones de segundo (la columna es DATETIME2(0)).</summary>
    private DateTime Ahora()
    {
        var ahora = _reloj.GetUtcNow().UtcDateTime;
        return new DateTime(ahora.Ticks - ahora.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);
    }
}
