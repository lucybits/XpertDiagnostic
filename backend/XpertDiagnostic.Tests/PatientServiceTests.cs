using System.ComponentModel.DataAnnotations;
using XpertDiagnostic.Api.Models;
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
    /// <summary>"Hoy" en todas las pruebas: 24 de noviembre de 2026.</summary>
    private static readonly RelojFijo Reloj = new(new DateTimeOffset(2026, 11, 24, 12, 0, 0, TimeSpan.Zero));

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
        repositorio.Pacientes.Add(new Patient { Id = "PACIE00010", NombreCompleto = "Previo", FechaNacimiento = new DateOnly(1986, 1, 1) });
        var servicio = new PatientService(repositorio, Reloj);

        // When se registra un paciente con espacios de más, nacida el 10 de marzo de 1974
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest
        {
            NombreCompleto = "  María   López  ",
            FechaNacimiento = new DateOnly(1974, 3, 10),
            Sexo = "F",
        });

        // Then se guarda como PACIE00011 con el nombre limpio, su fecha, su sexo, la edad calculada y sin datos de salida
        Assert.Equal("PACIE00011", creado.IdPaciente);
        Assert.Equal("María López", creado.NombreCompleto);
        Assert.Null(creado.Diagnostico);
        var guardado = Assert.Single(repositorio.Pacientes, p => p.Id == "PACIE00011");
        Assert.Equal(52, creado.Edad);
        Assert.Equal(new DateOnly(1974, 3, 10), guardado.FechaNacimiento);
        Assert.Equal("F", guardado.Sexo);
        Assert.Null(guardado.IdEnfermedadDiagnosticada);
        Assert.Null(guardado.IdTratamiento);
        Assert.Null(guardado.IdPlan);
    }

    [Fact]
    public async Task RegistrarAsync_ConCasillasDeAntecedentes_LasGuardaConElPaciente()
    {
        // Given un médico que marca fuma, biomasa y transfusiones, y deja el resto sin marcar
        var repositorio = new RepositorioPacientesFalso();
        var servicio = new PatientService(repositorio, Reloj);

        // When registra al paciente
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest
        {
            NombreCompleto = "Luis Peña",
            FechaNacimiento = new DateOnly(1965, 5, 5),
            Sexo = "M",
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
        var servicio = new PatientService(repositorio, Reloj);

        // When se registra el paciente
        var creado = await servicio.RegistrarAsync(new CreatePatientRequest { NombreCompleto = "Ana Ruiz", FechaNacimiento = new DateOnly(1996, 1, 1), Sexo = "F" });

        // Then se guarda con el ID siguiente libre
        Assert.Equal("PACIE00002", creado.IdPaciente);
        Assert.Equal(2, repositorio.Pacientes.Count);
    }

    [Theory]
    [InlineData("1990-11-24", 36)] // cumple años hoy
    [InlineData("1990-11-25", 35)] // cumple mañana
    [InlineData("2026-11-24", 0)]  // nació hoy
    [InlineData("2000-02-29", 26)]
    [InlineData("2026-11-25", -1)] // fecha futura
    public void EdadPaciente_Calcular_DevuelveAniosCumplidos(string nacimiento, int esperada)
    {
        // Given una fecha de nacimiento y hoy = 24/11/2026
        // When se calcula la edad
        var edad = EdadPaciente.Calcular(DateOnly.Parse(nacimiento), new DateOnly(2026, 11, 24));

        // Then son los años cumplidos (negativa si aún no nace)
        Assert.Equal(esperada, edad);
    }

    [Theory] // PT45
    [InlineData("María José Núñez", "1996-01-01", "F", true)]
    [InlineData("O'Connor-Pérez", "2026-11-24", "M", true)] // 0 años
    [InlineData("Ana Ruiz", "1896-11-24", "F", true)]       // 130 años
    [InlineData("111", "1996-01-01", "F", false)]
    [InlineData("Ana 2", "1996-01-01", "F", false)]
    [InlineData("Al", "1996-01-01", "F", false)]
    [InlineData("Ana Ruiz", "1895-11-25", "F", true)]       // 130; cumple 131 mañana
    [InlineData("Ana Ruiz", "1895-11-24", "F", false)]      // 131 años
    [InlineData("Ana Ruiz", "2026-11-25", "F", false)]      // fecha futura
    [InlineData("Ana Ruiz", "0001-01-01", "F", false)]      // fecha que faltó en el JSON
    [InlineData("Ana Ruiz", "1996-01-01", "X", false)]
    [InlineData("Ana Ruiz", "1996-01-01", "", false)]
    [InlineData("Ana Ruiz", "1996-01-01", " ", false)]
    [InlineData("Ana Ruiz", "1996-01-01", "f", true)]      // se convierte a "F"
    [InlineData("Ana Ruiz", "1996-01-01", "m", true)]      // se convierte a "M"
    [InlineData("Ana Ruiz", "1996-01-01", "FM", false)]    // más de un carácter
    [InlineData("Ana Ruiz", "1996-01-01", "M", true)]
    public void CreatePatientRequest_Reglas_ValidaNombreFechaYSexo(string nombre, string nacimiento, string sexo, bool esValido)
    {
        // Given una solicitud de alta y hoy = 24/11/2026
        var solicitud = new CreatePatientRequest
        {
            NombreCompleto = nombre,
            FechaNacimiento = DateOnly.Parse(nacimiento),
            Sexo = sexo,
        };

        // When ASP.NET Core la valida
        var contexto = new ValidationContext(solicitud, new ProveedorDeReloj(Reloj), null);
        var valido = Validator.TryValidateObject(solicitud, contexto, [], validateAllProperties: true);

        // Then se acepta solo si cumple RF-31 y la fecha da una edad de 0 a 130 años
        Assert.Equal(esValido, valido);
    }

    [Theory]
    [InlineData("f", "F")]
    [InlineData("m", "M")]
    [InlineData(" m ", "M")]
    [InlineData("F", "F")]
    public async Task RegistrarAsync_SexoEnMinuscula_SeGuardaEnMayuscula(string escrito, string guardado)
    {
        // Given un sexo escrito en minúscula o con espacios
        var repositorio = new RepositorioPacientesFalso();
        var servicio = new PatientService(repositorio, Reloj);

        // When se registra al paciente
        await servicio.RegistrarAsync(new CreatePatientRequest
        {
            NombreCompleto = "Ana Ruiz",
            FechaNacimiento = new DateOnly(1996, 1, 1),
            Sexo = escrito,
        });

        // Then se guarda en mayúscula
        Assert.Equal(guardado, Assert.Single(repositorio.Pacientes).Sexo);
    }

    [Fact]
    public async Task RegistrarAsync_FechaFutura_Lanza()
    {
        // Given una fecha de nacimiento posterior a hoy (se saltó la validación del modelo)
        var servicio = new PatientService(new RepositorioPacientesFalso(), Reloj);

        // When / Then el servicio la rechaza
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => servicio.RegistrarAsync(new CreatePatientRequest
        {
            NombreCompleto = "Ana Ruiz",
            FechaNacimiento = new DateOnly(2027, 1, 1),
            Sexo = "F",
        }));
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
                Pacientes.Add(new Patient { Id = paciente.Id, NombreCompleto = "Otro médico", FechaNacimiento = new DateOnly(2025, 1, 1) });
                return Task.FromResult(false);
            }
            if (Pacientes.Any(p => p.Id == paciente.Id)) return Task.FromResult(false);
            Pacientes.Add(paciente);
            Antecedentes.Add(antecedentes);
            return Task.FromResult(true);
        }
    }

    private sealed class RelojFijo(DateTimeOffset ahora) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => ahora;
        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private sealed class ProveedorDeReloj(TimeProvider reloj) : IServiceProvider
    {
        public object? GetService(Type serviceType) => serviceType == typeof(TimeProvider) ? reloj : null;
    }

    private sealed class RepositorioCatalogosFalso : ICatalogRepository
    {
        public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CatalogItem>>([]);
    }
}
