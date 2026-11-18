using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>
/// Implementación de <see cref="IUserRepository"/> con Entity Framework Core sobre SQL Server.
/// </summary>
public sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

        return db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task ActualizarPasswordHashAsync(
        User usuario,
        string nuevoHash,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(usuario);
        ArgumentException.ThrowIfNullOrWhiteSpace(nuevoHash);

        usuario.PasswordHash = nuevoHash;
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<UserAccess?> ObtenerAccesoAsync(int id, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

        return db.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UserAccess(u.Rol, u.Activo))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> PuedeConectarAsync(CancellationToken cancellationToken = default) =>
        db.Database.CanConnectAsync(cancellationToken);

    public Task<int> ContarAsync(CancellationToken cancellationToken = default) =>
        db.Usuarios.CountAsync(cancellationToken);
}
