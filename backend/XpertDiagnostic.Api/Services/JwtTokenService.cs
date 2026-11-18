using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Emite tokens JWT firmados con HMAC-SHA256. La clave, el emisor, la audiencia y la duración
/// vienen de <see cref="JwtOptions"/>; ninguno está escrito en el código.
/// </summary>
public sealed class JwtTokenService(IOptions<JwtOptions> options, TimeProvider tiempo) : ITokenService
{
    private readonly JwtOptions _opciones = options.Value;

    public GeneratedToken GenerarToken(User usuario)
    {
        ArgumentNullException.ThrowIfNull(usuario);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuario.Id);
        ArgumentException.ThrowIfNullOrWhiteSpace(usuario.Rol);

        var ahora = tiempo.GetUtcNow().UtcDateTime;
        var expiracion = ahora.AddMinutes(_opciones.ExpirationMinutes);

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.Key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        var token = new JwtSecurityToken(
            issuer: _opciones.Issuer,
            audience: _opciones.Audience,
            claims: claims,
            notBefore: ahora,
            expires: expiracion,
            signingCredentials: credenciales);

        return new GeneratedToken(new JwtSecurityTokenHandler().WriteToken(token), expiracion);
    }
}
