using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Api.Services.Interfaces;
using XpertDiagnostic.Tests.Fakes;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la fachada de autenticación con dobles de prueba en memoria.
/// Cada caso corresponde a un escenario Given-When-Then de specs/especificaciones/04-pruebas-tdd.md.
/// </summary>
public class AuthServiceTests
{
    private const int IdExistente = 123456;

    [Fact]
    public async Task LoginAsync_CredencialesCorrectas_DevuelveTokenYRol()
    {
        // Given un médico registrado con contraseña BCrypt
        var hash = BCrypt.Net.BCrypt.HashPassword("securePass123");
        var repositorio = new RepositorioFalso(CrearUsuario(hash));
        var servicio = CrearServicio(repositorio);

        // When inicia sesión desde el apartado Médico con su ID y contraseña correctos
        var resultado = await servicio.LoginAsync(IdExistente, "securePass123", UserRoles.MedicoTratante);

        // Then recibe su ID, su rol y un token
        Assert.Equal(LoginStatus.Exitoso, resultado.Estado);
        Assert.NotNull(resultado.Respuesta);
        Assert.Equal(IdExistente, resultado.Respuesta.UsuarioId);
        Assert.Equal(UserRoles.MedicoTratante, resultado.Respuesta.Rol);
        Assert.Equal("token-de-prueba", resultado.Respuesta.Token);
        Assert.Equal(0, repositorio.Actualizaciones);
    }

    [Fact]
    public async Task LoginAsync_InternistaDesdeApartadoMedico_DevuelveTokenYConservaRol()
    {
        var usuario = CrearUsuario(BCrypt.Net.BCrypt.HashPassword("securePass123"));
        usuario.Rol = UserRoles.MedicoInternista;
        var servicio = CrearServicio(new RepositorioFalso(usuario));

        var resultado = await servicio.LoginAsync(IdExistente, "securePass123", UserRoles.MedicoTratante);

        Assert.Equal(LoginStatus.Exitoso, resultado.Estado);
        Assert.Equal(UserRoles.MedicoInternista, resultado.Respuesta!.Rol);
    }

    [Fact]
    public async Task LoginAsync_ContrasenaIncorrecta_DevuelveCredencialesInvalidasYNoModificaDatos()
    {
        // Given un usuario registrado
        var hash = BCrypt.Net.BCrypt.HashPassword("securePass123");
        var repositorio = new RepositorioFalso(CrearUsuario(hash));
        var servicio = CrearServicio(repositorio);

        // When inicia sesión con una contraseña incorrecta
        var resultado = await servicio.LoginAsync(IdExistente, "Incorrecta123", UserRoles.MedicoTratante);

        // Then no se autentica y no se modifican datos
        Assert.Equal(LoginStatus.CredencialesInvalidas, resultado.Estado);
        Assert.Null(resultado.Respuesta);
        Assert.Equal(0, repositorio.Actualizaciones);
    }

    [Fact]
    public async Task LoginAsync_UsuarioInexistente_DevuelveCredencialesInvalidas()
    {
        // Given que no existe ningún usuario con el ID indicado
        var servicio = CrearServicio(new RepositorioFalso(null));

        // When alguien intenta iniciar sesión con ese ID
        var resultado = await servicio.LoginAsync(999999, "cualquiera", UserRoles.MedicoTratante);

        // Then no se autentica
        Assert.Equal(LoginStatus.CredencialesInvalidas, resultado.Estado);
    }

    [Fact]
    public async Task LoginAsync_ContrasenaHeredadaCorrecta_GuardaHashBCrypt()
    {
        // Given un usuario cuya contraseña sigue guardada en texto plano
        var usuario = CrearUsuario("pass1234");
        var repositorio = new RepositorioFalso(usuario);
        var servicio = CrearServicio(repositorio);

        // When inicia sesión con la contraseña correcta
        var resultado = await servicio.LoginAsync(IdExistente, "pass1234", UserRoles.MedicoTratante);

        // Then se autentica y la contraseña queda guardada como hash BCrypt
        Assert.Equal(LoginStatus.Exitoso, resultado.Estado);
        Assert.Equal(1, repositorio.Actualizaciones);
        Assert.StartsWith("$2", usuario.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("pass1234", usuario.PasswordHash));
    }

    [Fact]
    public async Task LoginAsync_MedicoEnApartadoAdministrador_DevuelveApartadoIncorrectoSinToken() // PT72
    {
        // Given un médico con contraseña correcta
        var hash = BCrypt.Net.BCrypt.HashPassword("securePass123");
        var servicio = CrearServicio(new RepositorioFalso(CrearUsuario(hash)));

        // When intenta entrar desde el apartado Administrador
        var resultado = await servicio.LoginAsync(IdExistente, "securePass123", UserRoles.Administrador);

        // Then no recibe token y se le indica que su cuenta es de médico
        Assert.Equal(LoginStatus.ApartadoIncorrecto, resultado.Estado);
        Assert.Null(resultado.Respuesta);
        Assert.Equal(UserRoles.MedicoTratante, resultado.RolDeLaCuenta);
    }

    [Fact]
    public async Task LoginAsync_AdministradorEnApartadoMedico_DevuelveApartadoIncorrectoSinToken() // PT73
    {
        // Given una cuenta de administrador sin registro de médico
        var hash = BCrypt.Net.BCrypt.HashPassword("admin");
        var admin = new User { Id = 654321, PasswordHash = hash, Rol = UserRoles.Administrador, IdMedico = null };
        var servicio = CrearServicio(new RepositorioFalso(admin));

        // When intenta entrar desde el apartado Médico
        var resultado = await servicio.LoginAsync(654321, "admin", UserRoles.MedicoTratante);

        // Then no recibe token y se le indica que su cuenta es de administrador
        Assert.Equal(LoginStatus.ApartadoIncorrecto, resultado.Estado);
        Assert.Equal(UserRoles.Administrador, resultado.RolDeLaCuenta);
    }

    [Fact]
    public async Task LoginAsync_AdministradorEnSuApartado_Entra() // PT74
    {
        // Given la cuenta de administrador de prueba
        var hash = BCrypt.Net.BCrypt.HashPassword("admin");
        var admin = new User { Id = 654321, PasswordHash = hash, Rol = UserRoles.Administrador, IdMedico = null };
        var servicio = CrearServicio(new RepositorioFalso(admin));

        // When entra desde el apartado Administrador
        var resultado = await servicio.LoginAsync(654321, "admin", UserRoles.Administrador);

        // Then recibe su token con rol A
        Assert.Equal(LoginStatus.Exitoso, resultado.Estado);
        Assert.Equal(UserRoles.Administrador, resultado.Respuesta!.Rol);
    }

    [Fact]
    public async Task LoginAsync_CuentaDesactivada_DevuelveCuentaInactivaSinToken() // PT75
    {
        // Given un médico cuya cuenta desactivó el administrador
        var usuario = CrearUsuario(BCrypt.Net.BCrypt.HashPassword("securePass123"));
        usuario.Activo = false;
        var servicio = CrearServicio(new RepositorioFalso(usuario));

        // When inicia sesión con su contraseña correcta
        var resultado = await servicio.LoginAsync(IdExistente, "securePass123", UserRoles.MedicoTratante);

        // Then no recibe token
        Assert.Equal(LoginStatus.CuentaInactiva, resultado.Estado);
        Assert.Null(resultado.Respuesta);
    }

    [Fact]
    public async Task LoginAsync_CuentaDesactivadaConContrasenaIncorrecta_NoRevelaElEstado() // PT76
    {
        // Given una cuenta desactivada
        var usuario = CrearUsuario(BCrypt.Net.BCrypt.HashPassword("securePass123"));
        usuario.Activo = false;
        var servicio = CrearServicio(new RepositorioFalso(usuario));

        // When alguien prueba una contraseña incorrecta
        var resultado = await servicio.LoginAsync(IdExistente, "Incorrecta123", UserRoles.MedicoTratante);

        // Then solo ve "credenciales inválidas": el estado de la cuenta no se revela
        Assert.Equal(LoginStatus.CredencialesInvalidas, resultado.Estado);
    }

    [Theory]
    [InlineData(0, "clave", "M")]
    [InlineData(-1, "clave", "M")]
    [InlineData(IdExistente, "", "M")]
    [InlineData(IdExistente, "   ", "M")]
    [InlineData(IdExistente, "clave", "X")]
    [InlineData(IdExistente, "clave", "")]
    public async Task LoginAsync_PrecondicionIncumplida_LanzaArgumentException(int id, string password, string rol)
    {
        var servicio = CrearServicio(new RepositorioFalso(null));

        await Assert.ThrowsAnyAsync<ArgumentException>(() => servicio.LoginAsync(id, password, rol));
    }

    [Fact]
    public async Task LoginAsync_ContrasenaDeMasDe72Caracteres_LanzaArgumentException()
    {
        var servicio = CrearServicio(new RepositorioFalso(null));

        await Assert.ThrowsAnyAsync<ArgumentException>(
            () => servicio.LoginAsync(IdExistente, new string('a', 73), UserRoles.MedicoTratante));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ActualCorrecta_GuardaLaNuevaCifrada() // PT77
    {
        // Given el administrador con su contraseña de prueba
        var admin = new User { Id = 654321, PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"), Rol = UserRoles.Administrador };
        var repositorio = new RepositorioFalso(admin);
        var servicio = CrearServicio(repositorio);

        // When la cambia escribiendo la actual correctamente
        var estado = await servicio.CambiarPasswordAsync(654321, "admin", "NuevaClave2026");

        // Then queda guardada la nueva, cifrada
        Assert.Equal(PasswordChangeStatus.Cambiada, estado);
        Assert.Equal("hash:NuevaClave2026", admin.PasswordHash);
        Assert.Equal(1, repositorio.Actualizaciones);
    }

    [Fact]
    public async Task CambiarPasswordAsync_ActualIncorrecta_NoCambiaNada() // PT78
    {
        // Given el administrador
        var hashOriginal = BCrypt.Net.BCrypt.HashPassword("admin");
        var admin = new User { Id = 654321, PasswordHash = hashOriginal, Rol = UserRoles.Administrador };
        var repositorio = new RepositorioFalso(admin);
        var servicio = CrearServicio(repositorio);

        // When escribe mal su contraseña actual
        var estado = await servicio.CambiarPasswordAsync(654321, "otra", "NuevaClave2026");

        // Then no se modifica nada
        Assert.Equal(PasswordChangeStatus.PasswordActualIncorrecta, estado);
        Assert.Equal(hashOriginal, admin.PasswordHash);
        Assert.Equal(0, repositorio.Actualizaciones);
    }

    [Fact]
    public async Task CambiarPasswordAsync_NuevaDeMenosDe8Caracteres_LanzaArgumentException()
    {
        var servicio = CrearServicio(new RepositorioFalso(null));

        await Assert.ThrowsAnyAsync<ArgumentException>(() => servicio.CambiarPasswordAsync(1, "admin", "corta"));
    }

    private static AuthService CrearServicio(IUserRepository repositorio) =>
        new(repositorio, new PasswordCredentialVerifier(), new TokenServiceFalso(), new HasherFalso());

    private static User CrearUsuario(string passwordGuardada) => new()
    {
        Id = IdExistente,
        PasswordHash = passwordGuardada,
        Rol = UserRoles.MedicoTratante,
        IdMedico = IdExistente,
        IdArea = 900001,
        Activo = true
    };

    internal sealed class RepositorioFalso(User? usuario) : IUserRepository
    {
        public int Actualizaciones { get; private set; }

        public Task<User?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(usuario?.Id == id ? usuario : null);

        public Task ActualizarPasswordHashAsync(User u, string nuevoHash, CancellationToken cancellationToken = default)
        {
            u.PasswordHash = nuevoHash;
            Actualizaciones++;
            return Task.CompletedTask;
        }

        public Task<UserAccess?> ObtenerAccesoAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(usuario?.Id == id ? new UserAccess(usuario.Rol, usuario.Activo) : null);

        public Task<bool> PuedeConectarAsync(CancellationToken cancellationToken = default) => Task.FromResult(true);

        public Task<int> ContarAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(usuario is null ? 0 : 1);
    }

    private sealed class TokenServiceFalso : ITokenService
    {
        public GeneratedToken GenerarToken(User usuario) =>
            new("token-de-prueba", DateTime.UtcNow.AddHours(2));
    }
}
