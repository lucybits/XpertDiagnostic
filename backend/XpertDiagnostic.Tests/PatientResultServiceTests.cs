using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la interfaz de salida (P-105) con dobles en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/09-interfaz-de-salida.md.
/// </summary>
public class PatientResultServiceTests
{
    [Theory] // PT59
    [InlineData(null, "PLAN_00001")]
    [InlineData("PLAN_00010", "PLAN_00011")]
    [InlineData("OTRO", "PLAN_00001")]
    public void SiguienteIdPlan_UltimoId_DevuelveElSiguiente(string? ultimo, string esperado) =>
        Assert.Equal(esperado, PatientResultService.SiguienteIdPlan(ultimo));

    [Fact]
    public async Task ConfirmarDiagnostico_OtraEnfermedad_QuitaElTratamientoAnterior() // PT60
    {
        // Given un paciente con asma y su tratamiento elegido
        var (servicio, salidas) = Crear();
        salidas.Diagnostico = "NEUMO00008";
        salidas.Tratamiento = "NEUMO00008TRATA00001";

        // When el médico confirma otra enfermedad
        var estado = await servicio.ConfirmarDiagnosticoAsync("PACIE00001", "CARDI00017");

        // Then se guarda el diagnóstico nuevo y el tratamiento anterior se quita
        Assert.Equal(SaveResultStatus.Guardado, estado);
        Assert.Equal("CARDI00017", salidas.Diagnostico);
        Assert.Null(salidas.Tratamiento);
    }

    [Fact]
    public async Task ConfirmarDiagnostico_EnfermedadInexistente_NoGuarda() // PT61
    {
        var (servicio, salidas) = Crear();

        var estado = await servicio.ConfirmarDiagnosticoAsync("PACIE00001", "XXXXX00000");

        Assert.Equal(SaveResultStatus.DatoInvalido, estado);
        Assert.Null(salidas.Diagnostico);
    }

    [Fact]
    public async Task ElegirTratamiento_ValidaDiagnosticoYEnfermedad() // PT62
    {
        var (servicio, salidas) = Crear();

        // Given sin diagnóstico → no se puede elegir tratamiento
        Assert.Equal(SaveResultStatus.SinDiagnostico, await servicio.ElegirTratamientoAsync("PACIE00001", "NEUMO00008TRATA00001"));

        // Given asma confirmada → un tratamiento de otra enfermedad se rechaza y uno del asma se guarda
        salidas.Diagnostico = "NEUMO00008";
        Assert.Equal(SaveResultStatus.DatoInvalido, await servicio.ElegirTratamientoAsync("PACIE00001", "CARDI00017TRATA00001"));
        Assert.Equal(SaveResultStatus.Guardado, await servicio.ElegirTratamientoAsync("PACIE00001", "NEUMO00008TRATA00001"));
        Assert.Equal("NEUMO00008TRATA00001", salidas.Tratamiento);
    }

    [Fact]
    public async Task GuardarPlan_SinPlan_CreaElSiguienteYDespuesLoActualiza() // PT63
    {
        // Given un paciente sin plan y planes hasta PLAN_00010
        var (servicio, salidas) = Crear();
        salidas.UltimoPlan = "PLAN_00010";

        // When el médico guarda su plan dos veces
        await servicio.GuardarPlanAsync("PACIE00001", new SaveCarePlanRequest { PlanIndicado = "  Reposo  ", Pronostico = " ", Seguimiento = "Cita en 7 días" });
        await servicio.GuardarPlanAsync("PACIE00001", new SaveCarePlanRequest { PlanIndicado = "Reposo y control", Seguimiento = "Cita en 7 días" });

        // Then se creó PLAN_00011 una sola vez y quedó con el último texto, sin espacios sobrantes
        var plan = Assert.Single(salidas.Planes);
        Assert.Equal("PLAN_00011", plan.Id);
        Assert.Equal("Reposo y control", plan.PlanIndicado);
        Assert.Null(plan.Pronostico);
        Assert.Equal("PLAN_00011", salidas.IdPlan);
    }

    [Fact]
    public async Task Obtener_TratamientoDeOtraEnfermedad_NoSeInforma() // PT64
    {
        // Given un tratamiento guardado que no es de la enfermedad diagnosticada (datos inconsistentes)
        var (servicio, salidas) = Crear();
        salidas.Diagnostico = "NEUMO00008";
        salidas.Tratamiento = "CARDI00017TRATA00001";

        // When se consulta el resultado
        var resultado = await servicio.ObtenerAsync("PACIE00001");

        // Then lista los tratamientos del asma y no marca ninguno como elegido
        Assert.NotNull(resultado);
        Assert.Equal(["NEUMO00008TRATA00001", "NEUMO00008TRATA00002"], resultado.Tratamientos.Select(t => t.IdTratamiento));
        Assert.Null(resultado.IdTratamiento);
        Assert.Null(await servicio.ObtenerAsync("PACIE09999"));
    }

    private static (PatientResultService Servicio, SalidasFalsas Salidas) Crear()
    {
        var salidas = new SalidasFalsas();
        return (new PatientResultService(salidas, new ExpedientesFalsos()), salidas);
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
        private static readonly string[] Enfermedades = ["NEUMO00008", "CARDI00017"];

        public string? Diagnostico { get; set; }
        public string? Tratamiento { get; set; }
        public string? IdPlan { get; private set; }
        public string? UltimoPlan { get; set; }
        public List<CarePlan> Planes { get; } = [];

        public Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente != "PACIE00001"
                ? null
                : new PatientOutputRow(new PatientSummary(idPaciente, "Ana Ruiz", new DateOnly(1996, 1, 1), null), Diagnostico, Diagnostico, Tratamiento, IdPlan));

        public Task<bool> ExisteEnfermedadAsync(string idEnfermedad, CancellationToken cancellationToken = default) =>
            Task.FromResult(Enfermedades.Contains(idEnfermedad));

        public Task<IReadOnlyList<TreatmentView>> ListarTratamientosAsync(string idEnfermedad, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<TreatmentView>>(
                [new($"{idEnfermedad}TRATA00001", "A", null, null, null), new($"{idEnfermedad}TRATA00002", "B", 1, 2, "mg")]);

        public Task<CarePlanView?> ObtenerPlanAsync(string idPlan, CancellationToken cancellationToken = default) =>
            Task.FromResult(Planes.Where(p => p.Id == idPlan).Select(p => new CarePlanView(p.Id, p.PlanIndicado, p.Pronostico, p.Seguimiento)).FirstOrDefault());

        public Task AsignarDiagnosticoAsync(string idPaciente, string idEnfermedad, string? idTratamiento, CancellationToken cancellationToken = default)
        {
            Diagnostico = idEnfermedad;
            Tratamiento = idTratamiento;
            return Task.CompletedTask;
        }

        public Task AsignarTratamientoAsync(string idPaciente, string idTratamiento, CancellationToken cancellationToken = default)
        {
            Tratamiento = idTratamiento;
            return Task.CompletedTask;
        }

        public Task<string?> ObtenerUltimoIdPlanAsync(CancellationToken cancellationToken = default) => Task.FromResult(UltimoPlan);

        public Task<bool> CrearPlanAsync(string idPaciente, CarePlan plan, CancellationToken cancellationToken = default)
        {
            Planes.Add(new CarePlan { Id = plan.Id, PlanIndicado = plan.PlanIndicado, Pronostico = plan.Pronostico, Seguimiento = plan.Seguimiento });
            IdPlan = plan.Id;
            UltimoPlan = plan.Id;
            return Task.FromResult(true);
        }

        public Task ActualizarPlanAsync(CarePlan plan, CancellationToken cancellationToken = default)
        {
            var guardado = Planes.Single(p => p.Id == plan.Id);
            guardado.PlanIndicado = plan.PlanIndicado;
            guardado.Pronostico = plan.Pronostico;
            guardado.Seguimiento = plan.Seguimiento;
            return Task.CompletedTask;
        }
    }
}
