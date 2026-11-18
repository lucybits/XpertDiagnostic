using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>Gestión de cuentas de médicos para el panel de administración (P-116).</summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class DoctorAdministrationService(IDoctorRepository medicos, IPasswordHasher hasher) : IDoctorAdministrationService
{
    private const int LongitudMaximaBusqueda = 120;
    private const int LongitudMinimaPassword = 8;
    private const int LongitudMaximaPassword = 72;

    private readonly IDoctorRepository _medicos = medicos ?? throw new ArgumentNullException(nameof(medicos));
    private readonly IPasswordHasher _hasher = hasher ?? throw new ArgumentNullException(nameof(hasher));

    public Task<IReadOnlyList<DoctorAccount>> ListarAsync(string? busqueda, CancellationToken cancellationToken = default)
    {
        var texto = busqueda?.Trim();
        if (texto?.Length > LongitudMaximaBusqueda)
            texto = texto[..LongitudMaximaBusqueda];

        return _medicos.ListarCuentasAsync(string.IsNullOrEmpty(texto) ? null : texto, cancellationToken);
    }

    public Task<DoctorAccount?> ObtenerAsync(int idMedico, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMedico);
        return _medicos.ObtenerCuentaAsync(idMedico, cancellationToken);
    }

    public async Task<DoctorUpdateResult> ActualizarAsync(
        int idMedico,
        UpdateDoctorRequest solicitud,
        CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMedico);
        ArgumentNullException.ThrowIfNull(solicitud);

        var cedula = solicitud.CedulaProfesional.Trim();

        if (await _medicos.ObtenerCuentaAsync(idMedico, cancellationToken) is null)
            return DoctorUpdateResult.NoEncontrado;

        if (await _medicos.ExisteCedulaAsync(cedula, excluirIdMedico: idMedico, cancellationToken))
            return DoctorUpdateResult.CedulaDuplicada;

        return await _medicos.ActualizarDatosAsync(
            idMedico,
            DoctorService.Limpiar(solicitud.NombreCompleto),
            DoctorService.Limpiar(solicitud.Especialidad),
            cedula,
            cancellationToken);
    }

    public Task<bool> RestablecerPasswordAsync(int idMedico, string password, CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMedico);
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        ArgumentOutOfRangeException.ThrowIfLessThan(password.Length, LongitudMinimaPassword, nameof(password));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(password.Length, LongitudMaximaPassword, nameof(password));

        return _medicos.ActualizarPasswordAsync(idMedico, _hasher.Hash(password), cancellationToken);
    }

    public async Task<DoctorAccount?> CambiarEstadoAsync(int idMedico, bool activo, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMedico);

        if (!await _medicos.CambiarEstadoAsync(idMedico, activo, cancellationToken))
            return null;

        return await _medicos.ObtenerCuentaAsync(idMedico, cancellationToken);
    }
}
