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
        repositorio.Pacientes.Add(Paciente("PACIE00010", "Previo"));
        var servicio = new PatientService(repositorio);

        // When el administrador registra un paciente con espacios de más
        var creado = await servicio.RegistrarAsync(Solicitud("  María   José ", " López ", "  Núñez", new DateOnly(1974, 3, 15)));

        // Then se guarda como PACIE00011 con las partes del nombre limpias, el nombre completo armado
        // con ellas, su fecha de nacimiento y sin datos de salida
        Assert.Equal("PACIE00011", creado.IdPaciente);
        Assert.Equal("María José López Núñez", creado.NombreCompleto);
        Assert.Null(creado.Diagnostico);
        var guardado = Assert.Single(repositorio.Pacientes, p => p.Id == "PACIE00011");
        Assert.Equal("María José", guardado.Nombres);
        Assert.Equal("López", guardado.ApellidoPaterno);
        Assert.Equal("Núñez", guardado.ApellidoMaterno);
        Assert.Equal(new DateOnly(1974, 3, 15), guardado.FechaNacimiento);
        Assert.Equal("F", guardado.Sexo);
        Assert.Null(guardado.IdEnfermedadDiagnosticada);
        Assert.Null(guardado.IdTratamiento);
        Assert.Null(guardado.IdPlan);
    }

    [Fact]
    public async Task RegistrarAsync_OtroMedicoTomoElId_ReintentaConElSiguiente() // PT44
    {
        // Given que entre la consulta y el guardado otro médico ocupó PACIE00001
        var repositorio = new RepositorioPacientesFalso { ChoquesSimulados = 1 };
        var servicio = new PatientService(repositorio);

        // When se registra el paciente
        var creado = await servicio.RegistrarAsync(Solicitud("Ana", "Ruiz", null, new DateOnly(1996, 1, 1)));

        // Then se guarda con el ID siguiente libre; sin apellido materno, el nombre completo no lo lleva
        Assert.Equal("PACIE00002", creado.IdPaciente);
        Assert.Equal("Ana Ruiz", creado.NombreCompleto);
        Assert.Null(repositorio.Pacientes.Single(p => p.Id == "PACIE00002").ApellidoMaterno);
        Assert.Equal(2, repositorio.Pacientes.Count);
    }

    [Theory] // PT45
    [InlineData("María José", "Núñez", "López", 30, true)]
    [InlineData("Sean", "O'Connor-Pérez", null, 0, true)]
    [InlineData("111", "Ruiz", null, 30, false)]
    [InlineData("Ana 2", "Ruiz", null, 30, false)]
    [InlineData("A", "Ruiz", null, 30, false)]
    [InlineData("Ana", "", null, 30, false)]
    [InlineData("Ana", "Ruiz", "R", 30, false)]
    [InlineData("Ana", "Ruiz", null, 131, false)]
    [InlineData("Ana", "Ruiz", null, -1, false)]
    public void CreatePatientRequest_Reglas_ValidaNombresYFecha(
        string nombres, string paterno, string? materno, int edad, bool esValido)
    {
        // Given una solicitud de alta; edad -1 representa una fecha de nacimiento futura
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var nacimiento = edad < 0 ? hoy.AddDays(1) : hoy.AddYears(-edad).AddDays(edad > 130 ? -1 : 0);
        var solicitud = Solicitud(nombres, paterno, materno, nacimiento);

        // When ASP.NET Core la valida
        var valido = Validator.TryValidateObject(solicitud, new ValidationContext(solicitud), [], validateAllProperties: true);

        // Then se acepta solo si cumple RF-31 y la fecha da una edad de 0 a 130 años
        Assert.Equal(esValido, valido);
    }

    [Theory]
    [InlineData("F", true)]
    [InlineData("M", true)]
    [InlineData("f", true)]   // se convierte a "F"
    [InlineData(" m ", true)] // se convierte a "M"
    [InlineData("", false)]
    [InlineData(" ", false)]
    [InlineData("X", false)]
    [InlineData("FM", false)] // más de un carácter
    public void CreatePatientRequest_Sexo_SoloFoM(string sexo, bool esValido)
    {
        // Given una solicitud de alta válida salvo, quizá, el sexo
        var solicitud = Solicitud("Ana", "Ruiz", null, new DateOnly(1996, 1, 1), sexo);

        // When ASP.NET Core la valida
        var valido = Validator.TryValidateObject(solicitud, new ValidationContext(solicitud), [], validateAllProperties: true);

        // Then solo se acepta un carácter F o M (en minúscula se convierte a mayúscula)
        Assert.Equal(esValido, valido);
    }

    [Theory]
    [InlineData("f", "F")]
    [InlineData("m", "M")]
    [InlineData(" m ", "M")]
    public async Task RegistrarAsync_SexoEnMinuscula_SeGuardaEnMayuscula(string escrito, string guardado)
    {
        // Given un sexo escrito en minúscula o con espacios
        var repositorio = new RepositorioPacientesFalso();
        var servicio = new PatientService(repositorio);

        // When se registra al paciente
        await servicio.RegistrarAsync(Solicitud("Ana", "Ruiz", null, new DateOnly(1996, 1, 1), escrito));

        // Then se guarda en mayúscula
        Assert.Equal(guardado, Assert.Single(repositorio.Pacientes).Sexo);
    }

    [Fact]
    public void CreatePatientRequest_SinFechaDeNacimiento_NoEsValida() // PT45
    {
        var solicitud = new CreatePatientRequest { Nombres = "Ana", ApellidoPaterno = "Ruiz", Sexo = "F" };

        var valido = Validator.TryValidateObject(solicitud, new ValidationContext(solicitud), [], validateAllProperties: true);

        Assert.False(valido);
    }

    [Theory] // PT100
    [InlineData("1990-06-15", "2026-06-14", 35)]
    [InlineData("1990-06-15", "2026-06-15", 36)]
    // Nacidos el 29 de febrero: en años no bisiestos cumplen el 28 de febrero.
    [InlineData("2000-02-29", "2026-02-27", 25)]
    [InlineData("2000-02-29", "2026-02-28", 26)]
    [InlineData("2026-11-24", "2026-11-24", 0)]
    [InlineData("2027-01-01", "2026-11-24", 0)]
    public void PatientAge_EnAnios_CuentaAniosCumplidos(string nacimiento, string hoy, int esperada)
    {
        // Given una fecha de nacimiento y la fecha de hoy
        // When se calcula la edad
        var edad = PatientAge.EnAnios(DateOnly.Parse(nacimiento), DateOnly.Parse(hoy));

        // Then son los años cumplidos: el cumpleaños cuenta desde ese día
        Assert.Equal(esperada, edad);
    }

    [Fact]
    public async Task EliminarAsync_PacienteExistente_LoBorra() // PT98
    {
        // Given dos pacientes registrados
        var repositorio = new RepositorioPacientesFalso();
        repositorio.Pacientes.Add(Paciente("PACIE00001", "Ana Ruiz"));
        repositorio.Pacientes.Add(Paciente("PACIE00002", "Luis Mora"));
        var servicio = new PatientService(repositorio);

        // When el administrador elimina al primero
        var eliminado = await servicio.EliminarAsync("PACIE00001");

        // Then se borra solo ese paciente
        Assert.True(eliminado);
        Assert.Equal("PACIE00002", Assert.Single(repositorio.Pacientes).Id);
    }

    [Theory] // PT99
    [InlineData("PACIE00009")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("PACIE000001")]
    public async Task EliminarAsync_PacienteInexistenteOIdInvalido_DevuelveFalse(string idPaciente)
    {
        // Given un paciente registrado
        var repositorio = new RepositorioPacientesFalso();
        repositorio.Pacientes.Add(Paciente("PACIE00001", "Ana Ruiz"));
        var servicio = new PatientService(repositorio);

        // When se pide eliminar un ID que no existe o que no puede existir
        var eliminado = await servicio.EliminarAsync(idPaciente);

        // Then no se borra nada; un ID vacío o más largo que la columna ni siquiera llega a la base
        Assert.False(eliminado);
        Assert.Single(repositorio.Pacientes);
        Assert.Equal(idPaciente == "PACIE00009" ? ["PACIE00009"] : [], repositorio.Eliminaciones);
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

    private static Patient Paciente(string id, string nombreCompleto) =>
        new() { Id = id, NombreCompleto = nombreCompleto, FechaNacimiento = new DateOnly(1990, 1, 1), Sexo = "F" };

    private static CreatePatientRequest Solicitud(
        string nombres, string paterno, string? materno, DateOnly nacimiento, string sexo = "F") =>
        new() { Nombres = nombres, ApellidoPaterno = paterno, ApellidoMaterno = materno, FechaNacimiento = nacimiento, Sexo = sexo };

    private sealed class RepositorioPacientesFalso : IPatientRepository
    {
        public List<Patient> Pacientes { get; } = [];

        /// <summary>Cuántas veces simular que otro médico guardó el mismo ID justo antes.</summary>
        public int ChoquesSimulados { get; set; }

        public Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PatientSummary>>(
                Pacientes.Select(p => new PatientSummary(p.Id, p.NombreCompleto, p.FechaNacimiento, null)).ToList());

        public Task<string?> ObtenerUltimoIdAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(Pacientes.Select(p => p.Id).Where(id => id.StartsWith("PACIE")).Order().LastOrDefault());

        public Task<bool> CrearAsync(Patient paciente, CancellationToken cancellationToken = default)
        {
            if (ChoquesSimulados > 0)
            {
                ChoquesSimulados--;
                Pacientes.Add(Paciente(paciente.Id, "Otro registro"));
                return Task.FromResult(false);
            }
            if (Pacientes.Any(p => p.Id == paciente.Id)) return Task.FromResult(false);
            Pacientes.Add(paciente);
            return Task.FromResult(true);
        }

        /// <summary>IDs con los que se llamó a EliminarAsync (para comprobar que no se consulta en vano).</summary>
        public List<string> Eliminaciones { get; } = [];

        public Task<bool> EliminarAsync(string idPaciente, CancellationToken cancellationToken = default)
        {
            Eliminaciones.Add(idPaciente);
            return Task.FromResult(Pacientes.RemoveAll(p => p.Id == idPaciente) > 0);
        }
    }

    private sealed class RepositorioCatalogosFalso : ICatalogRepository
    {
        public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CatalogItem>>([]);
    }
}
