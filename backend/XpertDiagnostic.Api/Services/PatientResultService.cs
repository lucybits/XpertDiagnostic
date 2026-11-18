using System.Globalization;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Interfaz de salida (P-105). El diagnóstico lo confirma el médico a partir del análisis; el
/// tratamiento lo elige entre los de esa enfermedad; el plan lo escribe él (decisiones de Lucía).
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class PatientResultService(IPatientResultRepository salidas, IPatientRecordService expedientes)
    : IPatientResultService
{
    public const string PrefijoPlan = "PLAN_";
    private const int IntentosMaximos = 3;

    private readonly IPatientResultRepository _salidas = salidas ?? throw new ArgumentNullException(nameof(salidas));
    private readonly IPatientRecordService _expedientes = expedientes ?? throw new ArgumentNullException(nameof(expedientes));

    public async Task<PatientResult?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        var salida = await _salidas.ObtenerSalidaAsync(idPaciente, cancellationToken);
        if (salida is null) return null;

        var expediente = await _expedientes.ObtenerAsync(idPaciente, cancellationToken);
        var tratamientos = salida.IdEnfermedadDiagnosticada is null
            ? []
            : await _salidas.ListarTratamientosAsync(salida.IdEnfermedadDiagnosticada, cancellationToken);
        var plan = salida.IdPlan is null ? null : await _salidas.ObtenerPlanAsync(salida.IdPlan, cancellationToken);

        return new PatientResult(
            salida.Paciente,
            expediente!,
            salida.IdEnfermedadDiagnosticada,
            salida.EnfermedadDiagnosticada,
            tratamientos,
            // Solo se informa si sigue siendo de la enfermedad diagnosticada.
            tratamientos.Any(t => t.IdTratamiento == salida.IdTratamiento) ? salida.IdTratamiento : null,
            plan);
    }

    public async Task<SaveResultStatus> ConfirmarDiagnosticoAsync(
        string idPaciente,
        string idEnfermedad,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentException.ThrowIfNullOrWhiteSpace(idEnfermedad);

        var salida = await _salidas.ObtenerSalidaAsync(idPaciente, cancellationToken);
        if (salida is null) return SaveResultStatus.PacienteNoExiste;
        if (!await _salidas.ExisteEnfermedadAsync(idEnfermedad, cancellationToken)) return SaveResultStatus.DatoInvalido;

        var tratamiento = salida.IdEnfermedadDiagnosticada == idEnfermedad ? salida.IdTratamiento : null;
        await _salidas.AsignarDiagnosticoAsync(idPaciente, idEnfermedad, tratamiento, cancellationToken);
        return SaveResultStatus.Guardado;
    }

    public async Task<SaveResultStatus> ElegirTratamientoAsync(
        string idPaciente,
        string idTratamiento,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentException.ThrowIfNullOrWhiteSpace(idTratamiento);

        var salida = await _salidas.ObtenerSalidaAsync(idPaciente, cancellationToken);
        if (salida is null) return SaveResultStatus.PacienteNoExiste;
        if (salida.IdEnfermedadDiagnosticada is null) return SaveResultStatus.SinDiagnostico;

        var tratamientos = await _salidas.ListarTratamientosAsync(salida.IdEnfermedadDiagnosticada, cancellationToken);
        if (!tratamientos.Any(t => t.IdTratamiento == idTratamiento)) return SaveResultStatus.DatoInvalido;

        await _salidas.AsignarTratamientoAsync(idPaciente, idTratamiento, cancellationToken);
        return SaveResultStatus.Guardado;
    }

    public async Task<SaveResultStatus> GuardarPlanAsync(
        string idPaciente,
        SaveCarePlanRequest plan,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentNullException.ThrowIfNull(plan);

        var salida = await _salidas.ObtenerSalidaAsync(idPaciente, cancellationToken);
        if (salida is null) return SaveResultStatus.PacienteNoExiste;

        var texto = new CarePlan
        {
            PlanIndicado = plan.PlanIndicado.Trim(),
            Pronostico = Vacio(plan.Pronostico),
            Seguimiento = Vacio(plan.Seguimiento),
        };
        if (texto.PlanIndicado.Length == 0) return SaveResultStatus.DatoInvalido;

        if (salida.IdPlan is not null)
        {
            texto.Id = salida.IdPlan;
            await _salidas.ActualizarPlanAsync(texto, cancellationToken);
            return SaveResultStatus.Guardado;
        }

        for (var intento = 0; intento < IntentosMaximos; intento++)
        {
            texto.Id = SiguienteIdPlan(await _salidas.ObtenerUltimoIdPlanAsync(cancellationToken));
            if (await _salidas.CrearPlanAsync(idPaciente, texto, cancellationToken)) return SaveResultStatus.Guardado;
        }
        throw new InvalidOperationException("No se pudo asignar un número de plan libre.");
    }

    /// <summary>Siguiente IdPlan a partir del mayor existente.</summary>
    /// <remarks>@post PLAN_ + 5 dígitos, uno más que ultimo; PLAN_00001 si no hay ninguno o no tiene el formato.</remarks>
    public static string SiguienteIdPlan(string? ultimo)
    {
        var numero = 0;
        if (ultimo is not null && ultimo.StartsWith(PrefijoPlan, StringComparison.Ordinal))
            int.TryParse(ultimo.AsSpan(PrefijoPlan.Length), NumberStyles.None, CultureInfo.InvariantCulture, out numero);
        return PrefijoPlan + (numero + 1).ToString("00000", CultureInfo.InvariantCulture);
    }

    private static string? Vacio(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
}
