using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>Valida la vigencia de la cuenta de un token contra USUARIOS (rol y estado).</summary>
public sealed class SessionValidator(IUserRepository usuarios) : ISessionValidator
{
    private readonly IUserRepository _usuarios = usuarios ?? throw new ArgumentNullException(nameof(usuarios));

    public async Task<bool> EsVigenteAsync(int usuarioId, string? rol, CancellationToken cancellationToken = default)
    {
        if (usuarioId <= 0 || string.IsNullOrEmpty(rol))
            return false;

        var acceso = await _usuarios.ObtenerAccesoAsync(usuarioId, cancellationToken);
        return acceso is not null && acceso.Activo && acceso.Rol == rol;
    }
}
