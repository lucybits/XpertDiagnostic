using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la captura estructurada y de la máquina de inferencia provisional (P-103), con dobles
/// en memoria. Cada caso corresponde a un escenario de specs/especificaciones/08-captura-y-analisis.md.
/// </summary>
public class PatientRecordServiceTests
{
    // Catálogo de síntomas de prueba: "Disnea" existe en dos enfermedades.
    private static readonly CatalogItem[] Sintomas =
    [
        new() { Id = "CARDI00017SINTO00001", Descripcion = "Disnea", IdEnfermedad = "CARDI00017" },
        new() { Id = "NEUMO00008SINTO00002", Descripcion = "disnea ", IdEnfermedad = "NEUMO00008" },
        new() { Id = "NEUMO00008SINTO00003", Descripcion = "Sibilancias", IdEnfermedad = "NEUMO00008" },
    ];

    private static readonly CatalogItem[] Signos =
    [
        new() { Id = "NEUMO00008SIGNO00001", Descripcion = "Frecuencia respiratoria", IdEnfermedad = "NEUMO00008", Unidades = "rpm" },
    ];

    private static readonly CatalogItem[] Enfermedades =
    [
        new() { Id = "CARDI00017", Descripcion = "Miocardiopatía dilatada" },
        new() { Id = "NEUMO00008", Descripcion = "Asma" },
    ];

    [Fact]
    public async Task GuardarHallazgos_DescripcionRepetida_GuardaTodosSusIds() // PT49
    {
        // Given "Disnea" en dos enfermedades y un paciente existente
        var (servicio, expedientes) = Crear();

        // When el médico elige "Disnea" (uno de sus IDs)
        var estado = await servicio.GuardarHallazgosAsync("PACIE00001", CatalogType.Sintomas,
            [new FindingInput { IdRegistro = "CARDI00017SINTO00001" }]);

        // Then se guardan los dos IDs equivalentes como "presente"
        Assert.Equal(SaveFindingsStatus.Guardado, estado);
        Assert.Equal(["CARDI00017SINTO00001", "NEUMO00008SINTO00002"], expedientes.Hallazgos.Select(h => h.IdRegistro).Order());
        Assert.All(expedientes.Hallazgos, h =>
        {
            Assert.Equal(FindingValues.Sintoma, h.TipoHallazgo);
            Assert.Equal(FindingValues.Presente, h.Valor);
        });
    }

    [Fact]
    public async Task GuardarHallazgos_RegistroFueraDelCatalogo_NoModificaNada() // PT50
    {
        // Given un paciente con un síntoma ya guardado
        var (servicio, expedientes) = Crear();
        expedientes.Hallazgos.Add(new PatientFinding { IdPaciente = "PACIE00001", TipoHallazgo = FindingValues.Sintoma, IdRegistro = "NEUMO00008SINTO00003" });

        // When se intenta guardar un ID que no es del catálogo de síntomas
        var estado = await servicio.GuardarHallazgosAsync("PACIE00001", CatalogType.Sintomas,
            [new FindingInput { IdRegistro = "NEUMO00008SIGNO00001" }]);

        // Then se rechaza y lo guardado no cambia
        Assert.Equal(SaveFindingsStatus.RegistroInvalido, estado);
        Assert.Equal("NEUMO00008SINTO00003", Assert.Single(expedientes.Hallazgos).IdRegistro);
    }

    [Fact]
    public async Task GuardarHallazgos_PacienteInexistente_NoModificaNada() // PT51
    {
        var (servicio, expedientes) = Crear();

        var estado = await servicio.GuardarHallazgosAsync("PACIE09999", CatalogType.Sintomas,
            [new FindingInput { IdRegistro = "CARDI00017SINTO00001" }]);

        Assert.Equal(SaveFindingsStatus.PacienteNoExiste, estado);
        Assert.Empty(expedientes.Hallazgos);
    }

    [Fact]
    public async Task GuardarHallazgos_ConMedicion_GuardaValorYUnidades() // PT52
    {
        // Given un signo con unidades
        var (servicio, expedientes) = Crear();

        // When se captura con su valor medido
        await servicio.GuardarHallazgosAsync("PACIE00001", CatalogType.Signos,
            [new FindingInput { IdRegistro = "NEUMO00008SIGNO00001", Valor = "28" }]);

        // Then se guardan el valor y las unidades del catálogo
        var hallazgo = Assert.Single(expedientes.Hallazgos);
        Assert.Equal("28", hallazgo.Valor);
        Assert.Equal("rpm", hallazgo.Unidades);
    }

    [Fact]
    public async Task AsignarPreexistente_EnfermedadInexistente_SeRechaza() // PT53
    {
        var (servicio, expedientes) = Crear();

        var invalida = await servicio.AsignarPreexistenteAsync("PACIE00001", "XXXXX00000");
        var valida = await servicio.AsignarPreexistenteAsync("PACIE00001", "NEUMO00008");

        Assert.Equal(SaveFindingsStatus.RegistroInvalido, invalida);
        Assert.Equal(SaveFindingsStatus.Guardado, valida);
        Assert.Equal("NEUMO00008", expedientes.Preexistente);
    }

    [Fact]
    public async Task Obtener_HallazgosEquivalentes_SeMuestranUnaVez() // PT54
    {
        // Given "Disnea" guardada con sus dos IDs
        var (servicio, _) = Crear();
        await servicio.GuardarHallazgosAsync("PACIE00001", CatalogType.Sintomas,
            [new FindingInput { IdRegistro = "CARDI00017SINTO00001" }]);

        // When se consulta el expediente
        var expediente = await servicio.ObtenerAsync("PACIE00001");

        // Then "Disnea" aparece una sola vez
        Assert.NotNull(expediente);
        Assert.Single(expediente.Hallazgos);
    }

    [Fact]
    public async Task MotorProvisional_OrdenaPorProporcionDeCriterios() // PT55
    {
        // Given hallazgos: Disnea (en ambas) y Sibilancias (solo asma)
        var motor = new ProvisionalInferenceEngine(new CatalogosFalsos());
        FindingView[] hallazgos =
        [
            new("Sintoma", "CARDI00017SINTO00001", "Disnea", "presente", null),
            new("Sintoma", "NEUMO00008SINTO00002", "disnea", "presente", null),
            new("Sintoma", "NEUMO00008SINTO00003", "Sibilancias", "presente", null),
        ];

        // When se infiere
        var candidatos = await motor.InferirAsync(hallazgos);
        var vacio = await motor.InferirAsync([]);

        // Then el asma (2 de 3 criterios) va antes que la miocardiopatía (1 de 1), ordenado por puntaje
        Assert.Equal(["CARDI00017", "NEUMO00008"], candidatos.Select(c => c.IdEnfermedad).Order());
        Assert.True(candidatos[0].Puntaje >= candidatos[1].Puntaje);
        var asma = Assert.Single(candidatos, c => c.IdEnfermedad == "NEUMO00008");
        Assert.Equal(2, asma.Coincidencias);
        Assert.Equal(3, asma.TotalCriterios);
        Assert.Empty(vacio);
    }

    private static (PatientRecordService Servicio, ExpedientesFalsos Expedientes) Crear()
    {
        var expedientes = new ExpedientesFalsos();
        return (new PatientRecordService(expedientes, new CatalogosFalsos()), expedientes);
    }

    private sealed class CatalogosFalsos : ICatalogRepository
    {
        public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CatalogItem>>(tipo switch
            {
                CatalogType.Sintomas => Sintomas,
                CatalogType.Signos => Signos,
                CatalogType.Enfermedades => Enfermedades,
                _ => [],
            });
    }

    private sealed class ExpedientesFalsos : IPatientRecordRepository
    {
        public List<PatientFinding> Hallazgos { get; } = [];
        public string? Preexistente { get; private set; }

        public Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == "PACIE00001");

        public Task<(string? Id, string? Nombre)> ObtenerPreexistenteAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult<(string?, string?)>((Preexistente, null));

        public Task<IReadOnlyList<FindingView>> ListarHallazgosAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<FindingView>>(Hallazgos
                .Select(h => new FindingView(h.TipoHallazgo, h.IdRegistro,
                    Sintomas.Concat(Signos).First(c => c.Id == h.IdRegistro).Descripcion, h.Valor, h.Unidades))
                .ToList());

        public Task ReemplazarHallazgosAsync(string idPaciente, string tipoHallazgo, IReadOnlyList<PatientFinding> hallazgos, CancellationToken cancellationToken = default)
        {
            Hallazgos.RemoveAll(h => h.IdPaciente == idPaciente && h.TipoHallazgo == tipoHallazgo);
            Hallazgos.AddRange(hallazgos);
            return Task.CompletedTask;
        }

        public Task AsignarPreexistenteAsync(string idPaciente, string? idEnfermedad, CancellationToken cancellationToken = default)
        {
            Preexistente = idEnfermedad;
            return Task.CompletedTask;
        }
    }
}
