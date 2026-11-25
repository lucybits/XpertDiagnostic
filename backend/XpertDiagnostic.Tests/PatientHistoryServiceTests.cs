using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas del interrogatorio del paciente (P-159) con un repositorio en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/12-interrogatorio.md.
/// </summary>
public class PatientHistoryServiceTests
{
    private const string Paciente = "PACIE00001";

    [Fact]
    public async Task Obtener_SinCapturar_DevuelveAmbasPartesVacias() // PT110
    {
        // Given un paciente sin interrogatorio
        var (servicio, _) = Crear();

        // When se consultan sus antecedentes, y los de un paciente que no existe
        var historia = await servicio.ObtenerAsync(Paciente);
        var inexistente = await servicio.ObtenerAsync("PACIE09999");

        // Then el primero existe con las dos partes en null; el segundo no existe
        Assert.NotNull(historia);
        Assert.Null(historia.NoPatologicos);
        Assert.Null(historia.Patologicos);
        Assert.Null(inexistente);
    }

    [Fact]
    public async Task GuardarNoPatologicos_DosVeces_QuedaElUltimo() // PT111
    {
        // Given un paciente sin antecedentes no patológicos
        var (servicio, datos) = Crear();

        // When el tratante responde y después corrige una respuesta
        await servicio.GuardarNoPatologicosAsync(Paciente, NoPatologicos(tabaquismo: true, biomasa: false));
        var guardado = await servicio.GuardarNoPatologicosAsync(Paciente, NoPatologicos(tabaquismo: true, biomasa: true));

        // Then queda una sola fila con las respuestas corregidas
        Assert.True(guardado);
        Assert.Equal(2, datos.EscriturasNoPatologicos);
        Assert.NotNull(datos.NoPatologicos);
        Assert.True(datos.NoPatologicos.Tabaquismo);
        Assert.True(datos.NoPatologicos.Biomasa);
        Assert.False(datos.NoPatologicos.Alcoholism);
        var historia = await servicio.ObtenerAsync(Paciente);
        Assert.True(historia!.NoPatologicos!.Biomasa);
    }

    [Fact]
    public async Task GuardarPatologicos_LimpiaTextosYVaciosQuedanNull() // PT112
    {
        // Given un paciente sin antecedentes patológicos
        var (servicio, datos) = Crear();

        // When el tratante escribe con espacios sobrantes y deja campos en blanco
        await servicio.GuardarPatologicosAsync(Paciente, new PathologicalHistoryData
        {
            Alergias = "  Penicilina  ",
            Cardiologic = "   ",
            Endocrinol = "Diabetes tipo 2",
        });

        // Then se guarda sin espacios y los vacíos quedan como "sin registrar" (null)
        Assert.NotNull(datos.Patologicos);
        Assert.Equal("Penicilina", datos.Patologicos.Alergias);
        Assert.Null(datos.Patologicos.Cardiologic);
        Assert.Equal("Diabetes tipo 2", datos.Patologicos.Endocrinol);
        Assert.Null(datos.Patologicos.Traumatism);
    }

    [Fact]
    public async Task Guardar_PacienteInexistente_NoGuarda() // PT113
    {
        var (servicio, datos) = Crear();

        Assert.False(await servicio.GuardarNoPatologicosAsync("PACIE09999", NoPatologicos(tabaquismo: false, biomasa: false)));
        Assert.False(await servicio.GuardarPatologicosAsync("PACIE09999", new PathologicalHistoryData { Alergias = "Polen" }));
        Assert.Null(datos.NoPatologicos);
        Assert.Null(datos.Patologicos);
    }

    private static NonPathologicalHistoryData NoPatologicos(bool tabaquismo, bool biomasa) => new()
    {
        Tabaquismo = tabaquismo,
        Alcoholismo = false,
        Toxicomanias = false,
        Biomasa = biomasa,
        TatuajesPerforaciones = false,
        Herbolaria = false,
        Transfusiones = false,
    };

    private static (PatientHistoryService Servicio, AntecedentesFalsos Datos) Crear()
    {
        var datos = new AntecedentesFalsos();
        return (new PatientHistoryService(datos), datos);
    }

    /// <summary>Antecedentes de un solo paciente (PACIE00001) en memoria.</summary>
    private sealed class AntecedentesFalsos : IPatientHistoryRepository
    {
        public NonPathologicalHistory? NoPatologicos { get; private set; }
        public PathologicalHistory? Patologicos { get; private set; }
        public int EscriturasNoPatologicos { get; private set; }

        public Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente);

        public Task<NonPathologicalHistory?> ObtenerNoPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente ? NoPatologicos : null);

        public Task<PathologicalHistory?> ObtenerPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default) =>
            Task.FromResult(idPaciente == Paciente ? Patologicos : null);

        public Task GuardarNoPatologicosAsync(NonPathologicalHistory antecedentes, CancellationToken cancellationToken = default)
        {
            NoPatologicos = antecedentes;
            EscriturasNoPatologicos++;
            return Task.CompletedTask;
        }

        public Task GuardarPatologicosAsync(PathologicalHistory antecedentes, CancellationToken cancellationToken = default)
        {
            Patologicos = antecedentes;
            return Task.CompletedTask;
        }
    }
}
