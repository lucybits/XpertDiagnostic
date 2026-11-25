using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using Xunit.Abstractions;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de solo lectura contra la base real (P-102): confirman que las consultas de pacientes y
/// catálogos coinciden con las tablas de CreateClinicalTables.sql. No insertan ni modifican nada.
/// Usan la misma cadena de conexión que la API (dotnet user-secrets del proyecto Api).
/// Para omitirlas: dotnet test --filter "Categoria!=Integracion"
/// </summary>
[Trait("Categoria", "Integracion")]
public class ClinicalDataIntegrationTests(ITestOutputHelper salida)
{
    private static AppDbContext CrearContexto()
    {
        var configuracion = new ConfigurationBuilder()
            .AddUserSecrets(typeof(AppDbContext).Assembly, optional: true)
            .AddEnvironmentVariables()
            .Build();
        var cadena = configuracion.GetConnectionString("DefaultConnection");
        Assert.False(string.IsNullOrWhiteSpace(cadena), "Falta ConnectionStrings:DefaultConnection en user-secrets.");
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(cadena).Options);
    }

    [Fact]
    public async Task PT47_Pacientes_SeLeenConSuDiagnosticoYUltimoId()
    {
        // Given la base con los pacientes de prueba del equipo
        await using var db = CrearContexto();
        var repositorio = new PatientRepository(db);

        // When se listan y se consulta el último ID
        var pacientes = await repositorio.ListarAsync();
        var ultimo = await repositorio.ObtenerUltimoIdAsync();

        // Then hay pacientes PACIE + 5 dígitos y el último ID es el mayor de la lista
        Assert.NotEmpty(pacientes);
        Assert.All(pacientes, p => Assert.Matches(@"^PACIE\d{5}$", p.IdPaciente));
        Assert.Equal(pacientes.Select(p => p.IdPaciente).Order(StringComparer.Ordinal).Last(), ultimo);
        Assert.Contains(pacientes, p => p.Diagnostico is not null);
    }

    [Theory]
    [InlineData(CatalogType.Sintomas)]
    [InlineData(CatalogType.Signos)]
    [InlineData(CatalogType.EstudiosLaboratorio)]
    [InlineData(CatalogType.Comorbilidades)]
    [InlineData(CatalogType.Enfermedades)]
    public async Task PT48_Catalogos_SeLeenOrdenadosPorDescripcion(CatalogType tipo)
    {
        // Given la base de conocimiento cargada
        await using var db = CrearContexto();
        var repositorio = new CatalogRepository(db);

        // When se lee el catálogo
        var elementos = await repositorio.ListarAsync(tipo);

        // Then trae elementos con ID y descripción, ordenados por descripción
        Assert.NotEmpty(elementos);
        Assert.All(elementos, e =>
        {
            Assert.False(string.IsNullOrWhiteSpace(e.Id));
            Assert.False(string.IsNullOrWhiteSpace(e.Descripcion));
        });
        Assert.Equal(tipo == CatalogType.Enfermedades, elementos.All(e => e.IdEnfermedad is null));
    }

    [Fact]
    public async Task PT56_ExpedienteDePrueba_AgrupaHallazgosEquivalentes()
    {
        // Given el paciente de prueba PACIE00001 con hallazgos del equipo
        await using var db = CrearContexto();
        var servicio = new PatientRecordService(new PatientRecordRepository(db), new CatalogRepository(db));

        // When se consulta su expediente
        var expediente = await servicio.ObtenerAsync("PACIE00001");

        // Then trae hallazgos con descripción y sin descripciones repetidas por tipo
        Assert.NotNull(expediente);
        Assert.NotEmpty(expediente.Hallazgos);
        Assert.All(expediente.Hallazgos, h => Assert.NotEqual(h.IdRegistro, h.Descripcion));
        Assert.Equal(
            expediente.Hallazgos.Count,
            expediente.Hallazgos.Select(h => (h.TipoHallazgo, h.Descripcion.Trim().ToLowerInvariant())).Distinct().Count());
    }

    [Fact]
    public async Task PT57_MaquinaDeInferencia_EvaluadaContraResultadosEsperados()
    {
        // Given los pacientes de prueba y su respuesta correcta (IO_ResultadosEsperados, solo para evaluar)
        await using var db = CrearContexto();
        var motor = new InferenceEngine(new CatalogRepository(db), new TreatmentRepository(db));
        var diagnosticos = new DiagnosisService(new PatientRecordRepository(db), motor);
        var esperados = await db.Database
            .SqlQuery<EsperadoFila>($"SELECT Id_Paciente AS IdPaciente, Id_Enfermedad AS IdEnfermedadEsperada FROM dbo.IO_ResultadosEsperados")
            .ToListAsync();

        // When se analiza cada paciente
        var aciertos = 0;
        foreach (var esperado in esperados)
        {
            var resultado = await diagnosticos.AnalizarAsync(esperado.IdPaciente);
            Assert.NotNull(resultado);
            // Copia literal del .prg (P-161): la lista va en orden alfabético, así que se mide si la enfermedad
            // esperada está en ella y cuántas trae.
            var posicion = resultado.Candidatos.ToList().FindIndex(c => c.IdEnfermedad == esperado.IdEnfermedadEsperada);
            if (posicion >= 0) aciertos++;
            salida.WriteLine($"{esperado.IdPaciente}: esperado {esperado.IdEnfermedadEsperada}, " +
                $"{(posicion >= 0 ? $"en la posición {posicion + 1}" : "NO está")} de {resultado.Candidatos.Count} candidatos");
        }

        // Then cada paciente con hallazgos tiene al menos un candidato; se informa la exactitud
        salida.WriteLine($"La enfermedad esperada está entre los candidatos: {aciertos} de {esperados.Count}");
        Assert.NotEmpty(esperados);
    }

    [Fact]
    public async Task PT65_ResultadoDePrueba_TraeDiagnosticoTratamientoYPlan()
    {
        // Given el paciente de prueba PACIE00001, que ya trae sus salidas en la base
        await using var db = CrearContexto();
        var expedientes = new PatientRecordService(new PatientRecordRepository(db), new CatalogRepository(db));
        var servicio = new PatientResultService(new PatientResultRepository(db), expedientes);

        // When se consulta su resultado
        var resultado = await servicio.ObtenerAsync("PACIE00001");

        // Then trae el diagnóstico, los tratamientos de esa enfermedad con el elegido entre ellos y su plan
        Assert.NotNull(resultado);
        Assert.Equal("CARDI00017", resultado.IdEnfermedadDiagnosticada);
        Assert.NotEmpty(resultado.Tratamientos);
        Assert.All(resultado.Tratamientos, t => Assert.StartsWith("CARDI00017", t.IdTratamiento));
        Assert.Contains(resultado.Tratamientos, t => t.IdTratamiento == resultado.IdTratamiento);
        Assert.NotNull(resultado.Plan);
        Assert.False(string.IsNullOrWhiteSpace(resultado.Plan.PlanIndicado));
    }

    private sealed record EsperadoFila(string IdPaciente, string IdEnfermedadEsperada);
}
