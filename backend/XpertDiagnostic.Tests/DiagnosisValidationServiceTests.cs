using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la validación del diagnóstico por el médico internista (P-151) con dobles en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/11-validacion-internista.md.
/// </summary>
public class DiagnosisValidationServiceTests
{
    private const string Paciente = "PACIE00001";
    private const int Tratante = 123456;
    private const int Internista = 654322;
    private static readonly DateTime Ahora = new(2026, 11, 24, 18, 30, 15, DateTimeKind.Utc);

    [Fact]
    public async Task Solicitar_ConCandidatos_QuedaPendienteConTratanteYFecha() // PT101
    {
        // Given un paciente sin enviar cuyo análisis propone asma
        var (servicio, datos) = Crear();

        // When el médico tratante lo envía al internista
        var estado = await servicio.SolicitarAsync(Paciente, Tratante);

        // Then queda pendiente, con quién y cuándo lo envió
        Assert.Equal(ValidationStatus.Guardado, estado);
        Assert.Equal(ValidationStates.Pendiente, datos.Estado);
        Assert.Equal(Tratante, datos.Solicitante);
        Assert.Equal(Ahora, datos.FechaSolicitud);
    }

    [Fact]
    public async Task Solicitar_SinCandidatosOPacienteInexistente_NoGuarda() // PT102
    {
        // Given un análisis sin candidatos
        var (servicio, datos) = Crear(candidatos: []);

        // When el tratante intenta enviarlo, o envía un paciente que no existe
        var sinCandidatos = await servicio.SolicitarAsync(Paciente, Tratante);
        var inexistente = await servicio.SolicitarAsync("PACIE09999", Tratante);

        // Then no se envía nada
        Assert.Equal(ValidationStatus.SinCandidatos, sinCandidatos);
        Assert.Equal(ValidationStatus.PacienteNoExiste, inexistente);
        Assert.Null(datos.Estado);
    }

    [Fact]
    public async Task Confirmar_Pendiente_GuardaDiagnosticoYQuienLoValido() // PT103
    {
        // Given un paciente pendiente con asma ya diagnosticada antes y su tratamiento
        var (servicio, datos) = Crear();
        datos.Estado = ValidationStates.Pendiente;
        datos.Diagnostico = "NEUMO00008";
        datos.Tratamiento = "NEUMO00008TRATA00001";

        // When el internista confirma la misma enfermedad
        var estado = await servicio.ConfirmarAsync(Paciente, "NEUMO00008", Internista);

        // Then queda confirmado por él, con la fecha, y el tratamiento se conserva
        Assert.Equal(ValidationStatus.Guardado, estado);
        Assert.Equal(ValidationStates.Confirmado, datos.Estado);
        Assert.Equal("NEUMO00008", datos.Diagnostico);
        Assert.Equal("NEUMO00008TRATA00001", datos.Tratamiento);
        Assert.Equal(Internista, datos.Validador);
        Assert.Equal(Ahora, datos.FechaValidacion);
    }

    [Fact]
    public async Task Confirmar_OtraEnfermedad_QuitaElTratamientoAnterior() // PT60
    {
        // Given un paciente pendiente con asma y su tratamiento elegido
        var (servicio, datos) = Crear();
        datos.Estado = ValidationStates.Pendiente;
        datos.Diagnostico = "NEUMO00008";
        datos.Tratamiento = "NEUMO00008TRATA00001";

        // When el internista confirma otra enfermedad candidata
        var estado = await servicio.ConfirmarAsync(Paciente, "CARDI00017", Internista);

        // Then se guarda el diagnóstico nuevo y el tratamiento anterior se quita
        Assert.Equal(ValidationStatus.Guardado, estado);
        Assert.Equal("CARDI00017", datos.Diagnostico);
        Assert.Null(datos.Tratamiento);
    }

    [Fact]
    public async Task Confirmar_EnfermedadNoCandidata_NoGuarda() // PT61
    {
        // Given un paciente pendiente
        var (servicio, datos) = Crear();
        datos.Estado = ValidationStates.Pendiente;

        // When el internista intenta confirmar una enfermedad que no propuso el análisis
        var estado = await servicio.ConfirmarAsync(Paciente, "GASTR00001", Internista);

        // Then se rechaza y sigue pendiente
        Assert.Equal(ValidationStatus.EnfermedadNoCandidata, estado);
        Assert.Equal(ValidationStates.Pendiente, datos.Estado);
        Assert.Null(datos.Diagnostico);
    }

    [Fact]
    public async Task Confirmar_SinEnviar_NoGuarda() // PT104
    {
        // Given un paciente que el tratante no ha enviado (por ejemplo, uno del seed con diagnóstico)
        var (servicio, datos) = Crear();
        datos.Diagnostico = "NEUMO00008";

        // When el internista intenta confirmar
        var estado = await servicio.ConfirmarAsync(Paciente, "CARDI00017", Internista);

        // Then se rechaza sin cambiar nada
        Assert.Equal(ValidationStatus.NoEnviado, estado);
        Assert.Null(datos.Estado);
        Assert.Equal("NEUMO00008", datos.Diagnostico);
        Assert.Null(datos.Validador);
    }

    [Fact]
    public async Task Confirmar_YaConfirmado_CorrigeElDiagnostico() // PT109
    {
        // Given un paciente que el internista confirmó con asma por error, con su tratamiento elegido
        var (servicio, datos) = Crear();
        datos.Estado = ValidationStates.Confirmado;
        datos.Diagnostico = "NEUMO00008";
        datos.Tratamiento = "NEUMO00008TRATA00001";
        datos.Validador = 111111;

        // When un internista lo corrige a otra enfermedad candidata
        var estado = await servicio.ConfirmarAsync(Paciente, "CARDI00017", Internista);

        // Then queda el diagnóstico corregido, con quién y cuándo lo corrigió, y el tratamiento anterior se quita
        Assert.Equal(ValidationStatus.Guardado, estado);
        Assert.Equal(ValidationStates.Confirmado, datos.Estado);
        Assert.Equal("CARDI00017", datos.Diagnostico);
        Assert.Null(datos.Tratamiento);
        Assert.Equal(Internista, datos.Validador);
        Assert.Equal(Ahora, datos.FechaValidacion);
    }

    [Fact]
    public async Task Solicitar_DespuesDeConfirmado_VuelveAPendienteYConservaElDiagnostico() // PT105
    {
        // Given un paciente ya confirmado por el internista
        var (servicio, datos) = Crear();
        datos.Estado = ValidationStates.Confirmado;
        datos.Diagnostico = "NEUMO00008";
        datos.Validador = Internista;

        // When el tratante corrige hallazgos y lo envía de nuevo
        await servicio.SolicitarAsync(Paciente, Tratante);

        // Then vuelve a pendiente, sin validador, y el diagnóstico anterior sigue hasta la nueva confirmación
        Assert.Equal(ValidationStates.Pendiente, datos.Estado);
        Assert.Null(datos.Validador);
        Assert.Equal("NEUMO00008", datos.Diagnostico);
    }

    [Theory] // PT106 (corregido en A-28)
    [InlineData(null, null)]
    [InlineData(ValidationStates.Pendiente, ValidationStates.Pendiente)]
    [InlineData(ValidationStates.Confirmado, ValidationStates.Confirmado)]
    [InlineData("X", null)]
    public void EstadoEfectivo_SoloLoGuardado_UnDiagnosticoSinValidarNoCuentaComoConfirmado(string? guardado, string? esperado) =>
        // Un diagnóstico del seed tiene estado NULL: sigue "sin enviar" aunque tenga enfermedad guardada.
        Assert.Equal(esperado, ValidationStates.Efectivo(guardado));

    private static (DiagnosisValidationService Servicio, ValidacionesFalsas Datos) Crear(
        IReadOnlyList<DiagnosisCandidate>? candidatos = null)
    {
        var datos = new ValidacionesFalsas();
        var analisis = new DiagnosticosFalsos(candidatos ??
        [
            new DiagnosisCandidate("NEUMO00008", "Asma", 3, 5, 0.6, ["Tos"]),
            new DiagnosisCandidate("CARDI00017", "Insuficiencia cardiaca", 1, 5, 0.2, ["Disnea"]),
        ]);
        return (new DiagnosisValidationService(datos, analisis, new ExpedientesFalsos(), new RelojFijo(Ahora)), datos);
    }

    private sealed class RelojFijo(DateTime ahora) : TimeProvider
    {
        // Con milisegundos: el servicio debe quitarlos (la columna es DATETIME2(0)).
        public override DateTimeOffset GetUtcNow() => new DateTimeOffset(ahora).AddMilliseconds(450);
    }

    private sealed class DiagnosticosFalsos(IReadOnlyList<DiagnosisCandidate> candidatos) : IDiagnosisService
    {
        public Task<DiagnosisResult?> AnalizarAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente ? new DiagnosisResult("Prueba", candidatos) : null);
    }

    private sealed class ExpedientesFalsos : IPatientRecordService
    {
        public bool TryParseSeccion(string nombre, out CatalogType catalogo) { catalogo = default; return false; }

        public Task<PatientRecord?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult<PatientRecord?>(idPaciente == Paciente ? new PatientRecord(idPaciente, []) : null);

        public Task<SaveFindingsStatus> GuardarHallazgosAsync(string idPaciente, CatalogType catalogo, IReadOnlyList<FindingInput> hallazgos, CancellationToken cancellationToken = default) =>
            Task.FromResult(SaveFindingsStatus.Guardado);

        public Task<SaveFindingsStatus> GuardarAntecedentesNoPatologicosAsync(
            string idPaciente,
            SaveNonPathologicalHistoryRequest respuestas,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(SaveFindingsStatus.Guardado);

        public Task<SaveFindingsStatus> GuardarHipotesisAsync(
            string idPaciente,
            string hipotesis,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(SaveFindingsStatus.Guardado);
    }

    /// <summary>Las columnas de validación de un solo paciente (PACIE00001).</summary>
    private sealed class ValidacionesFalsas : IDiagnosisValidationRepository
    {
        public string? Estado { get; set; }
        public string? Diagnostico { get; set; }
        public string? Tratamiento { get; set; }
        public int? Solicitante { get; private set; }
        public DateTime? FechaSolicitud { get; private set; }
        public int? Validador { get; set; }
        public DateTime? FechaValidacion { get; private set; }

        public Task<ValidationRow?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente ? new ValidationRow(Estado, Diagnostico, Tratamiento) : null);

        public Task<ValidationSummary?> ObtenerResumenAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente
                ? new ValidationSummary(Paciente, "Ana Ruiz", 30, "F", ValidationStates.Efectivo(Estado), null, FechaSolicitud, null, FechaValidacion, Diagnostico)
                : null);

        public Task<IReadOnlyList<ValidationSummary>> ListarAsync(string estado, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ValidationSummary>>([]);

        public Task SolicitarAsync(string idPaciente, int idTratante, DateTime fechaUtc, CancellationToken cancellationToken = default)
        {
            Estado = ValidationStates.Pendiente;
            Solicitante = idTratante;
            FechaSolicitud = fechaUtc;
            Validador = null;
            FechaValidacion = null;
            return Task.CompletedTask;
        }

        public Task ConfirmarAsync(string idPaciente, string idEnfermedad, string? idTratamiento, int idInternista, DateTime fechaUtc, CancellationToken cancellationToken = default)
        {
            Estado = ValidationStates.Confirmado;
            Diagnostico = idEnfermedad;
            Tratamiento = idTratamiento;
            Validador = idInternista;
            FechaValidacion = fechaUtc;
            return Task.CompletedTask;
        }
    }
}
