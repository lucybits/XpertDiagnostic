using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la interfaz de salida (P-105, solo lectura desde P-164) con dobles en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/09-interfaz-de-salida.md.
/// PT59, PT62 y PT63 (elegir tratamiento y escribir el plan) se retiraron en P-164: la salida ya no se edita.
/// </summary>
public class PatientResultServiceTests
{
    [Theory] // PT64
    [InlineData(null)]
    [InlineData(ValidationStates.Pendiente)]
    public async Task Obtener_SinConfirmacionDelInternista_NoMuestraSalidas(string? estado)
    {
        // Given un diagnóstico, tratamiento y plan guardados, pero sin confirmar por el internista
        var salidas = new SalidasFalsas { Estado = estado, Diagnostico = "NEUMO00008", Tratamiento = "NEUMO00008TRATA00002" };
        var servicio = new PatientResultService(salidas, new ExpedientesFalsos());

        // When se consulta el resultado
        var resultado = await servicio.ObtenerAsync("PACIE00001");

        // Then trae la historia clínica, pero ni diagnóstico, ni tratamientos, ni plan
        Assert.NotNull(resultado);
        Assert.Null(resultado.IdEnfermedadDiagnosticada);
        Assert.Null(resultado.EnfermedadDiagnosticada);
        Assert.Empty(resultado.Tratamientos);
        Assert.Null(resultado.IdTratamiento);
        Assert.Null(resultado.Plan);
        Assert.Null(await servicio.ObtenerAsync("PACIE09999"));
    }

    [Fact]
    public async Task Obtener_Confirmado_TratamientoYPlanSalenDeLaBaseDeConocimiento() // PT122
    {
        // Given el asma confirmada por el internista, con un tratamiento guardado distinto al primero y un
        // plan guardado con pronóstico y seguimiento
        var fecha = new DateTime(2026, 11, 25, 15, 30, 0, DateTimeKind.Utc);
        var salidas = new SalidasFalsas
        {
            Estado = ValidationStates.Confirmado,
            Diagnostico = "NEUMO00008",
            Tratamiento = "NEUMO00008TRATA00002",
            FechaValidacion = fecha,
        };
        salidas.Planes.Add(new CarePlanView("PLAN_00003", "Texto escrito a mano", "Bueno", "Cita en 7 días"));
        var servicio = new PatientResultService(salidas, new ExpedientesFalsos());

        // When se consulta el resultado
        var resultado = await servicio.ObtenerAsync("PACIE00001");

        // Then el tratamiento indicado es el primero de la enfermedad (como el .prg), el plan indicado lista
        // sus tratamientos con dosis y se conservan pronóstico, seguimiento y la fecha de confirmación
        Assert.NotNull(resultado);
        Assert.Equal("NEUMO00008", resultado.IdEnfermedadDiagnosticada);
        Assert.Equal("NEUMO00008TRATA00001", resultado.IdTratamiento);
        Assert.NotNull(resultado.Plan);
        Assert.Equal("1. A\n2. B (dosis: 1–2 mg)", resultado.Plan.PlanIndicado);
        Assert.Equal("Bueno", resultado.Plan.Pronostico);
        Assert.Equal("Cita en 7 días", resultado.Plan.Seguimiento);
        Assert.Equal(fecha, resultado.FechaValidacion);
    }

    [Fact]
    public async Task Obtener_ConfirmadoSinPlanGuardado_ArmaElPlanIndicado() // PT123
    {
        // Given una enfermedad confirmada y ningún plan guardado
        var salidas = new SalidasFalsas { Estado = ValidationStates.Confirmado, Diagnostico = "CARDI00017" };
        var servicio = new PatientResultService(salidas, new ExpedientesFalsos());

        // When se consulta el resultado
        var resultado = await servicio.ObtenerAsync("PACIE00001");

        // Then hay plan indicado (de la base de conocimiento) sin pronóstico ni seguimiento
        Assert.NotNull(resultado?.Plan);
        Assert.Null(resultado.Plan.IdPlan);
        Assert.StartsWith("1. A", resultado.Plan.PlanIndicado);
        Assert.Null(resultado.Plan.Pronostico);
        Assert.Null(resultado.Plan.Seguimiento);
    }

    private sealed class ExpedientesFalsos : IPatientRecordService
    {
        public bool TryParseSeccion(string nombre, out CatalogType catalogo) { catalogo = default; return false; }

        public Task<PatientRecord?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult<PatientRecord?>(new PatientRecord(idPaciente, []));

        public Task<SaveFindingsStatus> GuardarHallazgosAsync(string idPaciente, CatalogType catalogo, IReadOnlyList<FindingInput> hallazgos, CancellationToken cancellationToken = default) =>
            Task.FromResult(SaveFindingsStatus.Guardado);
    }

    private sealed class SalidasFalsas : IPatientResultRepository
    {
        public string? Estado { get; init; }
        public string? Diagnostico { get; init; }
        public string? Tratamiento { get; init; }
        public DateTime? FechaValidacion { get; init; }
        public List<CarePlanView> Planes { get; } = [];

        public Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente != "PACIE00001"
                ? null
                : new PatientOutputRow(
                    new PatientSummary(idPaciente, "Ana Ruiz", new DateOnly(1996, 1, 1), Diagnostico, Estado),
                    Diagnostico,
                    Diagnostico,
                    Tratamiento,
                    Planes.FirstOrDefault()?.IdPlan,
                    FechaValidacion));

        public Task<IReadOnlyList<TreatmentView>> ListarTratamientosAsync(string idEnfermedad, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<TreatmentView>>(
                [new($"{idEnfermedad}TRATA00001", "A", null, null, null), new($"{idEnfermedad}TRATA00002", "B", 1, 2, "mg")]);

        public Task<CarePlanView?> ObtenerPlanAsync(string idPlan, CancellationToken cancellationToken = default) =>
            Task.FromResult(Planes.FirstOrDefault(p => p.IdPlan == idPlan));
    }
}
