using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Fachada (patrón GoF estructural) del proceso de autenticación. El controlador solo
/// conoce estos métodos; buscar al usuario, verificar la contraseña, migrar el hash,
/// revisar rol y estado y emitir el token quedan ocultos detrás de ellos.
/// </summary>
public interface IAuthService
{
    /// <summary>Autentica a un usuario con su ID y contraseña desde un apartado del login.</summary>
    /// <remarks>
    /// @pre usuarioId &gt; 0
    /// @pre password no es null, vacío ni solo espacios, y tiene como máximo 72 caracteres.
    /// @pre rolSolicitado es "M" (apartado Médico) o "A" (apartado Administrador).
    /// @post Exitoso: la cuenta existe, la contraseña coincide, su rol es rolSolicitado y está activa;
    ///       la respuesta trae UsuarioId == usuarioId, el rol y un token no vacío que expira en el futuro.
    /// @post CredencialesInvalidas: el ID no existe o la contraseña no coincide; no se modifican datos.
    /// @post ApartadoIncorrecto / CuentaInactiva: solo se informan si la contraseña es correcta
    ///       (así no se revela qué IDs existen); no se emite token.
    /// @post Si la contraseña guardada estaba en texto plano y es correcta, queda reemplazada por un hash BCrypt.
    /// </remarks>
    Task<LoginResult> LoginAsync(int usuarioId, string password, string rolSolicitado, CancellationToken cancellationToken = default);

    /// <summary>Cambia la contraseña propia del usuario autenticado.</summary>
    /// <remarks>
    /// @pre usuarioId &gt; 0; passwordActual de 1 a 72 caracteres; passwordNueva de 8 a 72.
    /// @post Cambiada: la contraseña nueva quedó guardada como hash BCrypt.
    /// @post PasswordActualIncorrecta / CuentaNoEncontrada: no se modifica nada.
    /// </remarks>
    Task<PasswordChangeStatus> CambiarPasswordAsync(
        int usuarioId, string passwordActual, string passwordNueva, CancellationToken cancellationToken = default);
}
