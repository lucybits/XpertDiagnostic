using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Gestión de las cuentas de médicos desde el panel de administración (P-116).
/// Separada de <see cref="IDoctorService"/> (I de SOLID): el médico no necesita estas operaciones.
/// </summary>
/// <remarks>Ninguna operación toca cuentas de administrador ni devuelve contraseñas o hashes.</remarks>
public interface IDoctorAdministrationService
{
    /// <remarks>@post Médicos ordenados por nombre; filtrados si busqueda tiene texto. No modifica datos.</remarks>
    Task<IReadOnlyList<DoctorAccount>> ListarAsync(string? busqueda, CancellationToken cancellationToken = default);

    /// <remarks>@pre idMedico &gt; 0. @post La cuenta, o null si no existe. No modifica datos.</remarks>
    Task<DoctorAccount?> ObtenerAsync(int idMedico, CancellationToken cancellationToken = default);

    /// <summary>Edita nombre, especialidad, cédula (con espacios normalizados) y tipo de médico.</summary>
    /// <remarks>
    /// @pre idMedico &gt; 0 y solicitud cumple <see cref="UpdateDoctorRequest"/> (Rol es T o I).
    /// @post Actualizado con la cuenta guardada; NoEncontrado o CedulaDuplicada sin cambios.
    /// </remarks>
    Task<DoctorUpdateResult> ActualizarAsync(int idMedico, UpdateDoctorRequest solicitud, CancellationToken cancellationToken = default);

    /// <summary>Asigna una contraseña nueva (cifrada con BCrypt).</summary>
    /// <remarks>@pre idMedico &gt; 0 y password de 8 a 72 caracteres. @post true si se guardó; false si la cuenta no existe.</remarks>
    Task<bool> RestablecerPasswordAsync(int idMedico, string password, CancellationToken cancellationToken = default);

    /// <summary>Activa o desactiva la cuenta. Una cuenta inactiva no puede entrar y sus sesiones dejan de valer.</summary>
    /// <remarks>@pre idMedico &gt; 0. @post La cuenta con el estado nuevo, o null si no existe.</remarks>
    Task<DoctorAccount?> CambiarEstadoAsync(int idMedico, bool activo, CancellationToken cancellationToken = default);

    /// <summary>Borra de forma definitiva al médico y su cuenta (P-144). Para solo bloquearlo, se desactiva.</summary>
    /// <remarks>@pre idMedico &gt; 0. @post true si se borró; false si no existía o no es de rol médico (sin cambios).</remarks>
    Task<bool> EliminarAsync(int idMedico, CancellationToken cancellationToken = default);
}
