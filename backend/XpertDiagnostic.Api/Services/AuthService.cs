
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

public class AuthService(
    AppDbContext db,
    JwtTokenService jwtTokenService
) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(
        int usuarioId,
        string password)
    {
        var usuario = await db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario is null)
            return null;

        bool passwordCorrecta;

        try
        {
            passwordCorrecta = BCrypt.Net.BCrypt.Verify(
                password,
                usuario.PasswordHash
            );
        }
        catch (BCrypt.Net.SaltParseException)
        {
            passwordCorrecta = false;
        }

        if (!passwordCorrecta)
            return null;

        var (token, expiraEn) =
            jwtTokenService.GenerarToken(usuario);

        return new LoginResponse
        {
            UsuarioId = usuario.Id,
            Rol = usuario.Rol,
            Token = token,
            ExpiraEn = expiraEn
        };
    }
}
