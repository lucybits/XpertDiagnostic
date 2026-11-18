using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>
/// Acceso a datos de usuarios. Los servicios dependen de esta interfaz y no de
/// Entity Framework, lo que permite probarlos con implementaciones falsas.
/// </summary>
public interface IUserRepository
{
    /// <summary>Busca un usuario por su ID.</summary>
    /// <remarks>
    /// @pre id &gt; 0
    /// @post Devuelve el usuario con ese ID, o null si no existe. No modifica datos.
    /// </remarks>
    Task<User?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Reemplaza el hash de contraseña guardado de un usuario.</summary>
    /// <remarks>
    /// @pre usuario != null y fue obtenido con <see cref="ObtenerPorIdAsync"/>.
    /// @pre nuevoHash es un hash BCrypt de 60 caracteres.
    /// @post usuario.PasswordHash == nuevoHash y el cambio quedó guardado en la base de datos.
    /// </remarks>
    Task ActualizarPasswordHashAsync(User usuario, string nuevoHash, CancellationToken cancellationToken = default);

    /// <summary>Rol y estado actuales de la cuenta, sin cargar la contraseña.</summary>
    /// <remarks>
    /// @pre id &gt; 0
    /// @post Devuelve el acceso de la cuenta, o null si no existe. No modifica datos.
    /// </remarks>
    Task<UserAccess?> ObtenerAccesoAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Indica si la base de datos responde.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<bool> PuedeConectarAsync(CancellationToken cancellationToken = default);

    /// <summary>Cuenta los usuarios registrados.</summary>
    /// <remarks>@post Devuelve un valor &gt;= 0. No modifica datos.</remarks>
    Task<int> ContarAsync(CancellationToken cancellationToken = default);
}
