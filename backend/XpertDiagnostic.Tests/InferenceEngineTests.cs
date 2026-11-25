using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la máquina de inferencia (conversión de inference_engine.prg, P-160) con una base de
/// conocimiento pequeña en memoria. Cada caso corresponde a un escenario de
/// specs/especificaciones/13-maquina-de-inferencia.md.
/// </summary>
public class InferenceEngineTests
{
    // Base de conocimiento de prueba:
    //   ASMA (NEUMO00008):        síntomas Disnea, Sibilancias, Tos       → 3 criterios
    //   MIOCARDIOPATÍA (CARDI00017): síntoma Disnea; signo Edema          → 2 criterios
    //   HIPONATREMIA (HIDRO00001): síntoma Náusea; estudio Sodio bajo      → 2 criterios
    //   NEUMONÍA (INFEC00001):    síntomas Disnea, Tos; comorbilidad EPOC → 3 criterios
    private static readonly CatalogItem[] Sintomas =
    [
        Item("NEUMO00008SINTO00001", "DISNEA", "NEUMO00008"),
        Item("NEUMO00008SINTO00002", "SIBILANCIAS", "NEUMO00008"),
        Item("NEUMO00008SINTO00003", "TOS", "NEUMO00008"),
        Item("CARDI00017SINTO00001", "Disnea", "CARDI00017"),
        Item("HIDRO00001SINTO00001", "NÁUSEA", "HIDRO00001"),
        Item("INFEC00001SINTO00001", "disnea ", "INFEC00001"),
        Item("INFEC00001SINTO00002", "Tos", "INFEC00001"),
    ];
    private static readonly CatalogItem[] Signos = [Item("CARDI00017SIGNO00001", "EDEMA", "CARDI00017")];
    private static readonly CatalogItem[] Estudios = [Item("HIDRO00001ESTLAB00001", "SODIO BAJO", "HIDRO00001")];
    private static readonly CatalogItem[] Comorbilidades = [Item("INFEC00001COMOR00001", "EPOC", "INFEC00001")];
    private static readonly CatalogItem[] Enfermedades =
    [
        new() { Id = "NEUMO00008", Descripcion = "ASMA" },
        new() { Id = "CARDI00017", Descripcion = "MIOCARDIOPATÍA" },
        new() { Id = "HIDRO00001", Descripcion = "HIPONATREMIA" },
        new() { Id = "INFEC00001", Descripcion = "NEUMONÍA" },
    ];

    [Fact]
    public async Task Inferir_TodasLasEnfermedadesEnOrdenAlfabetico() // PT55 (copia literal del .prg, P-161)
    {
        // Given un paciente con Disnea, Tos y Sibilancias
        var motor = Crear();

        // When se infiere
        var candidatos = await motor.InferirAsync(
        [
            Hallazgo("Sintoma", "NEUMO00008SINTO00001", "Disnea"),
            Hallazgo("Sintoma", "NEUMO00008SINTO00003", "Tos"),
            Hallazgo("Sintoma", "NEUMO00008SINTO00002", "Sibilancias"),
        ]);

        // Then vienen las tres enfermedades que comparten algún síntoma, por nombre (como INDE ON enfermedad
        // UNIQUE), no por coincidencias. Las coincidencias se informan aparte.
        Assert.Equal(["ASMA", "MIOCARDIOPATÍA", "NEUMONÍA"], candidatos.Select(c => c.Nombre));
        Assert.Equal(3, candidatos[0].Coincidencias);
        Assert.Equal(1.0, candidatos[0].Puntaje);
        Assert.Equal(1, candidatos[1].Coincidencias);
        Assert.Equal(2, candidatos[2].Coincidencias);
        Assert.Equal(0.667, candidatos[2].Puntaje);
    }

    [Fact]
    public async Task Inferir_NombreRepetido_QuedaUnaSolaVez() // PT115 (P-161)
    {
        // Given dos enfermedades con el mismo nombre que comparten el síntoma del paciente
        CatalogItem[] sintomas = [Item("NEUMO00030SINTO00001", "FIEBRE", "NEUMO00030"), Item("INFEC00090SINTO00001", "FIEBRE", "INFEC00090")];
        CatalogItem[] enfermedades =
        [
            new() { Id = "NEUMO00030", Descripcion = "NEUMONÍA" },
            new() { Id = "INFEC00090", Descripcion = "Neumonía" },
        ];
        var motor = new InferenceEngine(new CatalogosFalsos(sintomas, [], [], [], enfermedades), new TratamientosFalsos());

        // When se infiere
        var candidatos = await motor.InferirAsync([Hallazgo("Sintoma", "NEUMO00030SINTO00001", "Fiebre")]);

        // Then queda una sola (UNIQUE por nombre), la de menor ID
        var candidato = Assert.Single(candidatos);
        Assert.Equal("INFEC00090", candidato.IdEnfermedad);
    }

    [Fact]
    public async Task Inferir_CompararTexto_IgnoraMayusculasAcentosYEspacios() // PT116
    {
        // Given la base escribe "NÁUSEA" y el paciente trae "  nausea " (sin acento, en minúsculas, con espacios)
        var motor = Crear();

        // When se infiere
        var candidatos = await motor.InferirAsync([Hallazgo("Sintoma", "XXXXX00000SINTO00001", "  nausea ")]);

        // Then coincide con la hiponatremia
        var candidato = Assert.Single(candidatos);
        Assert.Equal("HIDRO00001", candidato.IdEnfermedad);
        Assert.Equal(["nausea"], candidato.Apoyos);
    }

    [Fact]
    public async Task Inferir_UsaTodosLosTiposDeHallazgo() // PT117
    {
        // Given estudios de laboratorio y comorbilidades (el .prg solo usaba síntomas y signos)
        var motor = Crear();

        // When se infiere con un estudio y una comorbilidad
        var candidatos = await motor.InferirAsync(
        [
            Hallazgo("Estudio_lab", "HIDRO00001ESTLAB00001", "Sodio bajo"),
            Hallazgo("Comorbilidad", "INFEC00001COMOR00001", "EPOC"),
        ]);

        // Then cuentan para sus enfermedades; un signo con el mismo texto que un síntoma no se confunde de tipo
        Assert.Equal(["HIPONATREMIA", "NEUMONÍA"], candidatos.Select(c => c.Nombre));
        var sinTipoCorrecto = await motor.InferirAsync([Hallazgo("Signo", "XXXXX00000SIGNO00001", "Disnea")]);
        Assert.Empty(sinTipoCorrecto);
    }

    [Fact]
    public async Task Inferir_TraeElPrimerTratamientoDeCadaEnfermedad() // PT118
    {
        // Given el asma tiene tratamientos y la miocardiopatía no
        var motor = Crear();

        // When se infiere con Disnea y Edema
        var candidatos = await motor.InferirAsync(
        [
            Hallazgo("Sintoma", "CARDI00017SINTO00001", "Disnea"),
            Hallazgo("Signo", "CARDI00017SIGNO00001", "Edema"),
        ]);

        // Then cada candidato trae su primer tratamiento, o null si no tiene
        Assert.Null(candidatos.Single(c => c.IdEnfermedad == "CARDI00017").TratamientoSugerido);
        Assert.Equal("ELIMINAR DESENCADENANTES", candidatos.Single(c => c.IdEnfermedad == "NEUMO00008").TratamientoSugerido);
    }

    [Fact]
    public async Task Inferir_SinHallazgosOSinCoincidencias_NoDevuelveNada() // PT119
    {
        var motor = Crear();

        Assert.Empty(await motor.InferirAsync([]));
        Assert.Empty(await motor.InferirAsync([Hallazgo("Sintoma", "XXXXX00000SINTO00001", "Algo que no existe")]));
    }

    [Fact]
    public async Task Inferir_MuchasEnfermedades_LasDevuelveTodas() // PT120 (P-161: sin límite, como el .prg)
    {
        // Given un síntoma que es criterio de ocho enfermedades
        var sintomas = Enumerable.Range(1, 8).Select(i => Item($"ENFER{i:00000}SINTO00001", "FIEBRE", $"ENFER{i:00000}")).ToArray();
        var enfermedades = Enumerable.Range(1, 8).Select(i => new CatalogItem { Id = $"ENFER{i:00000}", Descripcion = $"ENFERMEDAD {i}" }).ToArray();
        var motor = new InferenceEngine(new CatalogosFalsos(sintomas, [], [], [], enfermedades), new TratamientosFalsos());

        // When se infiere
        var candidatos = await motor.InferirAsync([Hallazgo("Sintoma", "ENFER00001SINTO00001", "Fiebre")]);

        // Then vienen las ocho, en orden por nombre
        Assert.Equal(8, candidatos.Count);
        Assert.Equal(candidatos.Select(c => c.Nombre).Order(StringComparer.Ordinal), candidatos.Select(c => c.Nombre));
    }

    [Theory] // PT121
    [InlineData("  Melena (más de 100 ml) ", "MELENA (MAS DE 100 ML)")]
    [InlineData("DISNEA", "DISNEA")]
    [InlineData("Dolor   torácico", "DOLOR TORACICO")]
    public void Normalizar_QuitaAcentosMayusculasYEspacios(string texto, string esperado) =>
        Assert.Equal(esperado, InferenceEngine.Normalizar(texto));

    private static InferenceEngine Crear() =>
        new(new CatalogosFalsos(Sintomas, Signos, Estudios, Comorbilidades, Enfermedades), new TratamientosFalsos());

    private static CatalogItem Item(string id, string descripcion, string idEnfermedad) =>
        new() { Id = id, Descripcion = descripcion, IdEnfermedad = idEnfermedad };

    private static FindingView Hallazgo(string tipo, string id, string descripcion) => new(tipo, id, descripcion, "presente", null);

    private sealed class CatalogosFalsos(
        CatalogItem[] sintomas,
        CatalogItem[] signos,
        CatalogItem[] estudios,
        CatalogItem[] comorbilidades,
        CatalogItem[] enfermedades) : ICatalogRepository
    {
        public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CatalogItem>>(tipo switch
            {
                CatalogType.Sintomas => sintomas,
                CatalogType.Signos => signos,
                CatalogType.EstudiosLaboratorio => estudios,
                CatalogType.Comorbilidades => comorbilidades,
                CatalogType.Enfermedades => enfermedades,
                _ => [],
            });
    }

    private sealed class TratamientosFalsos : ITreatmentRepository
    {
        private static readonly Dictionary<string, string> Primeros = new()
        {
            ["NEUMO00008"] = "ELIMINAR DESENCADENANTES",
            ["INFEC00001"] = "ANTIBIÓTICO EMPÍRICO",
        };

        public Task<IReadOnlyDictionary<string, string>> ObtenerPrimerTratamientoAsync(
            IReadOnlyCollection<string> idsEnfermedad,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyDictionary<string, string>>(
                Primeros.Where(p => idsEnfermedad.Contains(p.Key)).ToDictionary(p => p.Key, p => p.Value));
    }
}
