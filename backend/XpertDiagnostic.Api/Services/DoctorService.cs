using System.Text.RegularExpressions;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Alta de médicos con su cuenta y consulta del perfil del usuario autenticado.
/// Depende solo de interfaces (D de SOLID), así que se prueba con dobles en memoria.
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed partial class DoctorService(IDoctorRepository medicos, IPasswordHasher hasher) : IDoctorService
{
    /// <summary>Nombre que se muestra para una cuenta de administrador sin registro de médico.</summary>
    public const string NombreAdministrador = "Administrador";
    public const string EspecialidadAdministrador = "Administración del sistema";

    private readonly IDoctorRepository _medicos = medicos ?? throw new ArgumentNullException(nameof(medicos));
    private readonly IPasswordHasher _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));

    public async Task<DoctorRegistrationResult> RegistrarAsync(
        CreateDoctorRequest solicitud,
        CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentNullException.ThrowIfNull(solicitud);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(solicitud.IdMedico);
        ArgumentException.ThrowIfNullOrWhiteSpace(solicitud.Password);
        if (!UserRoles.EsMedico(solicitud.Rol))
            throw new ArgumentException("El tipo de médico debe ser T o I.", nameof(solicitud));

        var cedula = solicitud.CedulaProfesional.Trim();

        if (await _medicos.ExisteIdAsync(solicitud.IdMedico, cancellationToken))
            return DoctorRegistrationResult.IdDuplicado;

        if (await _medicos.ExisteCedulaAsync(cedula, cancellationToken: cancellationToken))
            return DoctorRegistrationResult.CedulaDuplicada;

        var medico = new Doctor
        {
            Id = solicitud.IdMedico,
            NombreCompleto = Limpiar(solicitud.NombreCompleto),
            Especialidad = Limpiar(solicitud.Especialidad),
            CedulaProfesional = cedula
        };

        // Tratante o internista, según lo elija el administrador (P-144). Nunca administrador (P-116).
        var usuario = new User
        {
            Id = solicitud.IdMedico,
            PasswordHash = _hasher.Hash(solicitud.Password),
            Rol = solicitud.Rol,
            IdMedico = solicitud.IdMedico,
            Activo = true
        };

        // Si otra solicitud ganó la carrera entre la verificación y el guardado, la base lo rechaza.
        if (!await _medicos.CrearConCuentaAsync(medico, usuario, cancellationToken))
            return DoctorRegistrationResult.IdDuplicado;

        return DoctorRegistrationResult.Creado(new DoctorAccount(
            medico.Id, medico.NombreCompleto, medico.Especialidad, medico.CedulaProfesional,
            usuario.Rol, usuario.Activo, usuario.FechaRegistro));
    }

    public Task<bool> MarcarBienvenidaVistaAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);
        return _medicos.MarcarBienvenidaVistaAsync(usuarioId, cancellationToken);
    }

    public async Task<DoctorProfile?> ObtenerPerfilAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(usuarioId);
        var perfil = await _medicos.ObtenerPerfilAsync(usuarioId, cancellationToken);

        // Una cuenta de administrador no tiene registro de médico: se muestra con un nombre genérico.
        if (perfil is not null && perfil.Rol == UserRoles.Administrador && string.IsNullOrEmpty(perfil.NombreCompleto))
            return perfil with { NombreCompleto = NombreAdministrador, Especialidad = EspecialidadAdministrador };

        return perfil;
    }

    /// <summary>Quita espacios en los extremos y deja uno solo entre palabras.</summary>
    internal static string Limpiar(string texto) => EspaciosRepetidos().Replace(texto.Trim(), " ");

    [GeneratedRegex(@"\s+")]
    private static partial Regex EspaciosRepetidos();
}
