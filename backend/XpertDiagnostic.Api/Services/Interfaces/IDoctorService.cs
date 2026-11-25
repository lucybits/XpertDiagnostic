using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Registro de médicos y consulta del perfil del usuario autenticado.</summary>
public interface IDoctorService
{
    /// <summary>Crea al médico y su cuenta de usuario en una sola operación.</summary>
    /// <remarks>
    /// @pre solicitud cumple las reglas de <see cref="CreateDoctorRequest"/>.
    /// @post Creado: existen el médico y un usuario activo con el mismo ID, rol de médico y la contraseña cifrada.
    /// @post IdDuplicado o CedulaDuplicada: no se guardó nada.
    /// </remarks>
    Task<DoctorRegistrationResult> RegistrarAsync(CreateDoctorRequest solicitud, CancellationToken cancellationToken = default);

    /// <summary>Devuelve el perfil del usuario, o null si no existe.</summary>
    /// <remarks>
    /// @pre usuarioId &gt; 0.
    /// @post Un administrador sin registro de médico recibe nombre "Administrador". No modifica datos.
    /// </remarks>
    Task<DoctorProfile?> ObtenerPerfilAsync(int usuarioId, CancellationToken cancellationToken = default);
}
