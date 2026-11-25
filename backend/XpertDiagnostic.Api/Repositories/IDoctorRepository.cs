using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Acceso a datos de médicos y de sus cuentas.</summary>
/// <remarks>
/// Las operaciones de administración (listar, editar, contraseña, estado) solo ven médicos cuya cuenta
/// tiene rol de médico: una cuenta de administrador nunca se modifica desde el panel (P-116).
/// </remarks>
public interface IDoctorRepository
{
    /// <remarks>@post true si el ID ya está en MEDICOS o en USUARIOS. No modifica datos.</remarks>
    Task<bool> ExisteIdAsync(int id, CancellationToken cancellationToken = default);

    /// <remarks>@post true si algún médico, distinto de <paramref name="excluirIdMedico"/>, tiene esa cédula. No modifica datos.</remarks>
    Task<bool> ExisteCedulaAsync(string cedula, int? excluirIdMedico = null, CancellationToken cancellationToken = default);

    /// <summary>Guarda el médico y su usuario en una sola transacción.</summary>
    /// <remarks>
    /// @pre usuario.IdMedico == medico.Id.
    /// @post true: ambos quedaron guardados (y usuario.FechaRegistro tiene la fecha de la base).
    /// @post false: chocó con un ID o una cédula existente y no se guardó nada.
    /// </remarks>
    Task<bool> CrearConCuentaAsync(Doctor medico, User usuario, CancellationToken cancellationToken = default);

    /// <remarks>
    /// @post Perfil del usuario con los datos de su médico, o null si no existe. Una cuenta sin registro
    ///       de médico (administrador) devuelve nombre y especialidad vacíos. No modifica datos.
    /// </remarks>
    Task<DoctorProfile?> ObtenerPerfilAsync(int usuarioId, CancellationToken cancellationToken = default);

    /// <summary>Médicos con cuenta de médico, ordenados por nombre.</summary>
    /// <remarks>
    /// @post Si busqueda tiene texto, solo los que lo contienen en el nombre o la especialidad, o cuyo
    ///       ID o cédula empiezan con él. No modifica datos.
    /// </remarks>
    Task<IReadOnlyList<DoctorAccount>> ListarCuentasAsync(string? busqueda, CancellationToken cancellationToken = default);

    /// <remarks>@post La cuenta del médico, o null si no existe o no es de rol médico. No modifica datos.</remarks>
    Task<DoctorAccount?> ObtenerCuentaAsync(int idMedico, CancellationToken cancellationToken = default);

    /// <summary>Reemplaza nombre, especialidad, cédula y tipo (rol T o I) de un médico.</summary>
    /// <remarks>
    /// @pre rol es "T" o "I".
    /// @post Actualizado: los cuatro campos quedaron guardados. NoEncontrado/CedulaDuplicada: no cambió nada.
    /// </remarks>
    Task<DoctorUpdateResult> ActualizarDatosAsync(
        int idMedico, string nombreCompleto, string especialidad, string cedulaProfesional, string rol,
        CancellationToken cancellationToken = default);

    /// <summary>Borra de forma definitiva la cuenta (USUARIOS) y el registro (MEDICOS) de un médico.</summary>
    /// <remarks>
    /// @post true si existía con rol de médico y se borraron ambos en una sola transacción; false si no
    ///       existía o no es de rol médico (no se borra nada). Una cuenta de administrador nunca se borra.
    /// </remarks>
    Task<bool> EliminarAsync(int idMedico, CancellationToken cancellationToken = default);

    /// <summary>Reemplaza el hash de contraseña de la cuenta de un médico.</summary>
    /// <remarks>@pre nuevoHash es un hash BCrypt. @post true si la cuenta existe y es de médico; false si no (sin cambios).</remarks>
    Task<bool> ActualizarPasswordAsync(int idMedico, string nuevoHash, CancellationToken cancellationToken = default);

    /// <summary>Activa o desactiva la cuenta de un médico (baja lógica).</summary>
    /// <remarks>@post true si la cuenta existe y es de médico (queda Activo = activo); false si no (sin cambios).</remarks>
    Task<bool> CambiarEstadoAsync(int idMedico, bool activo, CancellationToken cancellationToken = default);
}
