using System.Globalization;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Interfaz de salida (P-105), de solo lectura desde P-164. El diagnóstico es el que confirmó el médico
/// internista entre los candidatos de la máquina de inferencia (<see cref="DiagnosisValidationService"/>,
/// P-151). El tratamiento indicado es el primero de esa enfermedad, como en inference_engine.prg, y el plan
/// indicado lista los tratamientos de la base de conocimiento.
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class PatientResultService(IPatientResultRepository salidas, IPatientRecordService expedientes)
    : IPatientResultService
{
    private readonly IPatientResultRepository _salidas = salidas ?? throw new ArgumentNullException(nameof(salidas));
    private readonly IPatientRecordService _expedientes = expedientes ?? throw new ArgumentNullException(nameof(expedientes));

    public async Task<PatientResult?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        var salida = await _salidas.ObtenerSalidaAsync(idPaciente, cancellationToken);
        if (salida is null) return null;

        var expediente = await _expedientes.ObtenerAsync(idPaciente, cancellationToken);

        // Sin la confirmación del internista no se muestran salidas (también los pacientes de prueba con un
        // diagnóstico cargado de antemano).
        var confirmado = salida.Paciente.EstadoValidacion == ValidationStates.Confirmado && salida.IdEnfermedadDiagnosticada is not null;
        if (!confirmado)
            return new PatientResult(salida.Paciente, expediente!, null, null, [], null, null);

        var tratamientos = await _salidas.ListarTratamientosAsync(salida.IdEnfermedadDiagnosticada!, cancellationToken);
        var guardado = salida.IdPlan is null ? null : await _salidas.ObtenerPlanAsync(salida.IdPlan, cancellationToken);
        var plan = tratamientos.Count == 0
            ? guardado
            : new CarePlanView(guardado?.IdPlan, PlanIndicado(tratamientos), guardado?.Pronostico, guardado?.Seguimiento);

        return new PatientResult(
            salida.Paciente,
            expediente!,
            salida.IdEnfermedadDiagnosticada,
            salida.EnfermedadDiagnosticada,
            tratamientos,
            tratamientos.Count > 0 ? tratamientos[0].IdTratamiento : null,
            plan,
            salida.FechaValidacion);
    }

    /// <summary>Plan indicado a partir de los tratamientos de la enfermedad.</summary>
    /// <remarks>@pre tratamientos no está vacío. @post Una línea por tratamiento, en orden de ID, con su dosis si la tiene.</remarks>
    public static string PlanIndicado(IReadOnlyList<TreatmentView> tratamientos) =>
        string.Join('\n', tratamientos.Select((t, i) =>
        {
            var dosis = Dosis(t);
            return $"{i + 1}. {t.Descripcion.Trim()}{(dosis is null ? "" : $" (dosis: {dosis})")}";
        }));

    private static string? Dosis(TreatmentView t)
    {
        if (t.DosisMinima is null && t.DosisMaxima is null) return null;
        var min = t.DosisMinima?.ToString("0.##", CultureInfo.InvariantCulture);
        var max = t.DosisMaxima?.ToString("0.##", CultureInfo.InvariantCulture);
        var rango = min is not null && max is not null && min != max ? $"{min}–{max}" : (min ?? max)!;
        return string.IsNullOrWhiteSpace(t.Unidades) ? rango : $"{rango} {t.Unidades.Trim()}";
    }
}
