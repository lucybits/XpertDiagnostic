using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Emite tokens de acceso para usuarios autenticados.</summary>
public interface ITokenService
{
    /// <summary>Genera un token firmado para el usuario.</summary>
    /// <remarks>
    /// @pre usuario != null, usuario.Id &gt; 0 y usuario.Rol no está vacío.
    /// @post Token no está vacío, contiene el ID y el rol del usuario, y ExpiraEn es posterior al momento actual.
    /// </remarks>
    GeneratedToken GenerarToken(User usuario);
}
