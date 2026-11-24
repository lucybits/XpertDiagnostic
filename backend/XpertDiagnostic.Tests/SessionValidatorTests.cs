using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas de la validación de sesión que se hace en cada petición autenticada (ESP-007):
/// un token solo vale mientras su cuenta exista, esté activa y conserve el rol.
/// </summary>
public class SessionValidatorTests
{
    [Fact]
    public async Task EsVigenteAsync_CuentaActivaConSuRol_True() // PT87
    {
        var validador = Crear(new User { Id = 500, Rol = UserRoles.MedicoTratante, Activo = true });

        Assert.True(await validador.EsVigenteAsync(500, UserRoles.MedicoTratante));
    }

    [Fact]
    public async Task EsVigenteAsync_CuentaDesactivadaDespuesDeEntrar_False() // PT88
    {
        // Given un médico con sesión abierta cuya cuenta el administrador desactivó
        var validador = Crear(new User { Id = 500, Rol = UserRoles.MedicoTratante, Activo = false });

        // When usa su token
        // Then deja de valer
        Assert.False(await validador.EsVigenteAsync(500, UserRoles.MedicoTratante));
    }

    [Theory]
    [InlineData(500, UserRoles.Administrador)] // el rol del token ya no coincide
    [InlineData(999, UserRoles.MedicoTratante)] // la cuenta ya no existe
    [InlineData(0, UserRoles.MedicoTratante)]
    [InlineData(500, null)]
    public async Task EsVigenteAsync_DatosQueNoCoinciden_False(int usuarioId, string? rol)
    {
        var validador = Crear(new User { Id = 500, Rol = UserRoles.MedicoTratante, Activo = true });

        Assert.False(await validador.EsVigenteAsync(usuarioId, rol));
    }

    private static SessionValidator Crear(User usuario) => new(new AuthServiceTests.RepositorioFalso(usuario));
}
