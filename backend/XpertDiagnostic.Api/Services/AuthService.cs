using System.Diagnostics;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;


/// Patrón Fachada (GoF, estructural). Coordina los subsistemas que participan en el
/// inicio de sesión (repositorio de usuarios, verificador de contraseñas, cifrador y emisor de tokens)
/// y ofrece al controlador operaciones simples: <see cref="LoginAsync"/> y <see cref="CambiarPasswordAsync"/>.

/// SOLID: cada subsistema tiene una sola responsabilidad (S) y la fachada depende solo de
/// sus interfaces (D), así que se pueden sustituir (L) sin modificar esta clase (O).
/// @inv Las dependencias no son null durante toda la vida del objeto.

public sealed class AuthService(
    IUserRepository usuarios,
    IPasswordCredentialVerifier verificador,
    ITokenService tokens,
    IPasswordHasher hasher
) : IAuthService
{
    private const int LongitudMaximaPassword = 72;
    private const int LongitudMinimaPasswordNueva = 8;

    private readonly IUserRepository _usuarios = usuarios ?? throw new ArgumentNullException(nameof(usuarios));
    private readonly IPasswordCredentialVerifier _verificador = verificador ?? throw new ArgumentNullException(nameof(verificador));
    private readonly ITokenService _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));
    private readonly IPasswordHasher _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));

    public async Task<LoginResult> LoginAsync(
        int usuarioId,
        string password,
        string rolSolicitado,
        CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(password.Length, LongitudMaximaPassword, nameof(password));
        if (rolSolicitado is not (UserRoles.Medico or UserRoles.Administrador))
            throw new ArgumentException("El rol solicitado debe ser M o A.", nameof(rolSolicitado));

        var usuario = await _usuarios.ObtenerPorIdAsync(usuarioId, cancellationToken);

        var verificacion = _verificador.Verificar(password, usuario?.PasswordHash);
        if (usuario is null || !verificacion.EsValida)
            return LoginResult.CredencialesInvalidas;

        if (verificacion.HashActualizado is not null)
            await _usuarios.ActualizarPasswordHashAsync(usuario, verificacion.HashActualizado, cancellationToken);

        // Cada apartado del login solo acepta cuentas de su rol (P-116).
        if (usuario.Rol != rolSolicitado)
            return LoginResult.ApartadoIncorrecto(usuario.Rol);

        if (!usuario.Activo)
            return LoginResult.CuentaInactiva;

        var token = _tokens.GenerarToken(usuario);

        // @post
        Debug.Assert(!string.IsNullOrEmpty(token.Token), "El token emitido no puede estar vacío.");

        return LoginResult.Exitoso(new LoginResponse
        {
            UsuarioId = usuario.Id,
            Rol = usuario.Rol,
            Token = token.Token,
            ExpiraEn = token.ExpiraEn
        });
    }

    public async Task<PasswordChangeStatus> CambiarPasswordAsync(
        int usuarioId,
        string passwordActual,
        string passwordNueva,
        CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);
        ArgumentException.ThrowIfNullOrEmpty(passwordActual);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(passwordActual.Length, LongitudMaximaPassword, nameof(passwordActual));
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordNueva);
        ArgumentOutOfRangeException.ThrowIfLessThan(passwordNueva.Length, LongitudMinimaPasswordNueva, nameof(passwordNueva));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(passwordNueva.Length, LongitudMaximaPassword, nameof(passwordNueva));

        var usuario = await _usuarios.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario is null)
            return PasswordChangeStatus.CuentaNoEncontrada;

        if (!_verificador.Verificar(passwordActual, usuario.PasswordHash).EsValida)
            return PasswordChangeStatus.PasswordActualIncorrecta;

        await _usuarios.ActualizarPasswordHashAsync(usuario, _hasher.Hash(passwordNueva), cancellationToken);
        return PasswordChangeStatus.Cambiada;
    }
}
