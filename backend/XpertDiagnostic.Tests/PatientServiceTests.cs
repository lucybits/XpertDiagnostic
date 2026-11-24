using System.ComponentModel.DataAnnotations;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas del alta de pacientes y de los catálogos con dobles en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/07-nuevo-paciente.md.
/// </summary>
public class PatientServiceTests
{
    [Theory] // PT42
    [InlineData(null, "PACIE00001")]
    [InlineData("PACIE00009", "PACIE00010")]
    [InlineData("PACIE00010", "PACIE00011")]
    [InlineData("OTRO", "PACIE00001")]
    public void SiguienteId_UltimoId_DevuelveElSiguiente(string? ultimo, string esperado)
    {
        // Given el mayor IdPaciente registrado (o ninguno)
        // When se calcula el siguiente
        var siguiente = PatientService.SiguienteId(ultimo);

        // Then es el número siguiente con 5 dígitos
        Assert.Equal(esperado, siguiente);
    }

    [Fact]
    public async Task RegistrarAsync_DatosValidos_GuardaSoloEntradasConSiguienteId() // PT43
    {
        // Given pacientes hasta PACIE00010
        var repositorio = new RepositorioPacientesFalso();
        repositorio.Pacientes.Add(new Patient { Id = "PACIE00010", NombreCompleto = "Previo", Edad = 40 });
        var servicio = new PatientService(repositorio);

        // When se registra un paciente con espacios de más
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest { NombreCompleto = "  María   López  ", Edad = 52 });

        // Then se guarda como PACIE00011 con el nombre limpio y sin datos de salida
        Assert.Equal("PACIE00011", creado.IdPaciente);
        Assert.Equal("María López", creado.NombreCompleto);
        Assert.Null(creado.Diagnostico);
        var guardado = Assert.Single(repositorio.Pacientes, p => p.Id == "PACIE00011");
        Assert.Equal(52, guardado.Edad);
        Assert.Null(guardado.IdEnfermedadDiagnosticada);
        Assert.Null(guardado.IdTratamiento);
        Assert.Null(guardado.IdPlan);
    }

    [Fact]
    public async Task RegistrarAsync_ConCasillasDeAntecedentes_LasGuardaConElPaciente()
    {
        // Given un médico que marca fuma, biomasa y transfusiones, y deja el resto sin marcar
        var repositorio = new RepositorioPacientesFalso();
        var servicio = new PatientService(repositorio);

        // When registra al paciente
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest
        {
            NombreCompleto = "Luis Peña",
            Edad = 61,
            Tabaquismo = true,
            Biomasa = true,
            Transfusiones = true,
        });

        // Then sus antecedentes no patológicos quedan guardados con el mismo ID: marcadas = sí, el resto = no
        var antecedentes = Assert.Single(repositorio.Antecedentes);
        Assert.Equal(creado.IdPaciente, antecedentes.IdPaciente);
        Assert.True(antecedentes.Tabaquismo);
        Assert.Equal(1, antecedentes.Biomasa);
        Assert.True(antecedentes.Transfusio);
        Assert.False(antecedentes.Alcoholism);
        Assert.False(antecedentes.Toxicomans);
        Assert.False(antecedentes.TatuajPerf);
        Assert.False(antecedentes.Herbolaria);
    }

    [Fact]
    public async Task RegistrarAsync_OtroMedicoTomoElId_ReintentaConElSiguiente() // PT44
    {
        // Given que entre la consulta y el guardado otro médico ocupó PACIE00001
        var repositorio = new RepositorioPacientesFalso { ChoquesSimulados = 1 };
        var servicio = new PatientService(repositorio);

        // When se registra el paciente
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest { NombreCompleto = "Ana Ruiz", Edad = 30 });

        // Then se guarda con el ID siguiente libre
        Assert.Equal("PACIE00002", creado.IdPaciente);
        Assert.Equal(2, repositorio.Pacientes.Count);
    }

    [Theory] // PT45
    [InlineData("María José Núñez", 30, true)]
    [InlineData("O'Connor-Pérez", 0, true)]
    [InlineData("111", 30, false)]
    [InlineData("Ana 2", 30, false)]
    [InlineData("Al", 30, false)]
    [InlineData("Ana Ruiz", 131, false)]
    [InlineData("Ana Ruiz", -1, false)]
    public void CreatePatientRequest_Reglas_ValidaNombreYEdad(string nombre, int edad, bool esValido)
    {
        // Given una solicitud de alta
        var solicitud = new CreatePatientRequest { NombreCompleto = nombre, Edad = edad };

        // When ASP.NET Core la valida
        var valido = Validator.TryValidateObject(solicitud, new ValidationContext(solicitud), [], validateAllProperties: true);

        // Then se acepta solo si cumple RF-31
        Assert.Equal(esValido, valido);
    }

    [Theory] // PT46
    [InlineData("sintomas", true, CatalogType.Sintomas)]
    [InlineData("SIGNOS", true, CatalogType.Signos)]
    [InlineData("estudios-laboratorio", true, CatalogType.EstudiosLaboratorio)]
    [InlineData("comorbilidades", true, CatalogType.Comorbilidades)]
    [InlineData("enfermedades", true, CatalogType.Enfermedades)]
    [InlineData("pacientes", false, default(CatalogType))]
    [InlineData("", false, default(CatalogType))]
    public void CatalogService_TryParse_SoloAdmiteCatalogosConocidos(string nombre, bool existe, CatalogType esperado)
    {
        // Given el nombre del catálogo en la URL
        var servicio = new CatalogService(new RepositorioCatalogosFalso());

        // When se interpreta
        var encontrado = servicio.TryParse(nombre, out var tipo);

        // Then solo los cinco catálogos de la base de conocimiento son válidos
        Assert.Equal(existe, encontrado);
        if (existe) Assert.Equal(esperado, tipo);
    }

    private sealed class RepositorioPacientesFalso : IPatientRepository
    {
        public List<Patient> Pacientes { get; } = [];
        public List<NonPathologicalHistory> Antecedentes { get; } = [];

        /// <summary>Cuántas veces simular que otro médico guardó el mismo ID justo antes.</summary>
        public int ChoquesSimulados { get; set; }

        public Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PatientSummary>>(
                Pacientes.Select(p => new PatientSummary(p.Id, p.NombreCompleto, p.Edad, null)).ToList());

        public Task<string?> ObtenerUltimoIdAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(Pacientes.Select(p => p.Id).Where(id => id.StartsWith("PACIE")).Order().LastOrDefault());

        public Task<bool> CrearAsync(Patient paciente, NonPathologicalHistory antecedentes, CancellationToken cancellationToken = default)
        {
            if (ChoquesSimulados > 0)
            {
                ChoquesSimulados--;
                Pacientes.Add(new Patient { Id = paciente.Id, NombreCompleto = "Otro médico", Edad = 1 });
                return Task.FromResult(false);
            }
            if (Pacientes.Any(p => p.Id == paciente.Id)) return Task.FromResult(false);
            Pacientes.Add(paciente);
            Antecedentes.Add(antecedentes);
            return Task.FromResult(true);
        }
    }

    private sealed class RepositorioCatalogosFalso : ICatalogRepository
    {
        public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CatalogItem>>([]);
    }
}
