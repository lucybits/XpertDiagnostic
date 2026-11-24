using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Options;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

public class JwtTokenServiceTests
{
    private static readonly DateTimeOffset Ahora = new(2026, 1, 15, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public void GenerarToken_UsuarioValido_IncluyeIdRolEmisorYExpiracion()
    {
        // Given una configuración JWT válida y un usuario con rol
        var servicio = CrearServicio();
        var usuario = new User { Id = 123456, Rol = UserRoles.MedicoTratante, PasswordHash = "x" };

        // When se genera su token
        var resultado = servicio.GenerarToken(usuario);

        // Then el token contiene su ID, su rol, el emisor y expira según la configuración
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(resultado.Token);
        Assert.Equal("XpertDiagnostic.Api", jwt.Issuer);
        Assert.Contains("XpertDiagnostic.Frontend", jwt.Audiences);
        Assert.Contains(jwt.Claims, c => c.Value == "123456");
        Assert.Contains(jwt.Claims, c => c.Value == UserRoles.MedicoTratante);
        Assert.Equal(Ahora.UtcDateTime.AddMinutes(120), resultado.ExpiraEn);
    }

    [Fact]
    public void GenerarToken_UsuarioSinRol_LanzaArgumentException()
    {
        var servicio = CrearServicio();

        Assert.ThrowsAny<ArgumentException>(
            () => servicio.GenerarToken(new User { Id = 1, Rol = "" }));
    }

    private static JwtTokenService CrearServicio() => new(
        Options.Create(new JwtOptions
        {
            Key = "clave-de-pruebas-de-al-menos-32-caracteres",
            Issuer = "XpertDiagnostic.Api",
            Audience = "XpertDiagnostic.Frontend",
            ExpirationMinutes = 120
        }),
        new RelojFijo(Ahora));

    private sealed class RelojFijo(DateTimeOffset ahora) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => ahora;
    }
}
