using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Tests.Fakes;

/// <summary>Cifrador falso: "hash:" + contraseña, para comprobar que nunca se guarda el texto original.</summary>
internal sealed class HasherFalso : IPasswordHasher
{
    public string Hash(string password) => $"hash:{password}";
}

/// <summary>Repositorio de médicos en memoria con las mismas reglas que <see cref="DoctorRepository"/>.</summary>
internal sealed class RepositorioMedicosFalso : IDoctorRepository
{
    public static readonly DateTime FechaAlta = new(2026, 11, 18, 12, 0, 0, DateTimeKind.Utc);

    public List<Doctor> Medicos { get; } = [];
    public List<User> Usuarios { get; } = [];

    /// <summary>Agrega un médico con su cuenta (rol médico, activa salvo que se indique).</summary>
    public RepositorioMedicosFalso ConMedico(int id, string nombre, string cedula, bool activo = true, string especialidad = "Cardiología")
    {
        Medicos.Add(new Doctor { Id = id, NombreCompleto = nombre, Especialidad = especialidad, CedulaProfesional = cedula });
        Usuarios.Add(new User { Id = id, PasswordHash = "hash:original", Rol = UserRoles.MedicoTratante, IdMedico = id, Activo = activo, FechaRegistro = FechaAlta });
        return this;
    }

    public Task<bool> ExisteIdAsync(int id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Medicos.Any(m => m.Id == id) || Usuarios.Any(u => u.Id == id));

    public Task<bool> ExisteCedulaAsync(string cedula, int? excluirIdMedico = null, CancellationToken cancellationToken = default) =>
        Task.FromResult(Medicos.Any(m => m.CedulaProfesional == cedula && m.Id != excluirIdMedico));

    public Task<bool> CrearConCuentaAsync(Doctor medico, User usuario, CancellationToken cancellationToken = default)
    {
        usuario.FechaRegistro = FechaAlta;
        Medicos.Add(medico);
        Usuarios.Add(usuario);
        return Task.FromResult(true);
    }

    public Task<DoctorProfile?> ObtenerPerfilAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        var usuario = Usuarios.FirstOrDefault(u => u.Id == usuarioId);
        if (usuario is null) return Task.FromResult<DoctorProfile?>(null);
        var medico = Medicos.FirstOrDefault(m => m.Id == usuario.IdMedico);
        return Task.FromResult<DoctorProfile?>(new DoctorProfile(
            usuario.Id, usuario.Rol, medico?.NombreCompleto ?? string.Empty, medico?.Especialidad ?? string.Empty));
    }

    public Task<IReadOnlyList<DoctorAccount>> ListarCuentasAsync(string? busqueda, CancellationToken cancellationToken = default)
    {
        IEnumerable<DoctorAccount> cuentas = Cuentas();
        if (!string.IsNullOrEmpty(busqueda))
        {
            cuentas = cuentas.Where(c =>
                c.NombreCompleto.Contains(busqueda, StringComparison.OrdinalIgnoreCase)
                || c.Especialidad.Contains(busqueda, StringComparison.OrdinalIgnoreCase)
                || c.CedulaProfesional.StartsWith(busqueda, StringComparison.Ordinal)
                || c.IdMedico.ToString().StartsWith(busqueda, StringComparison.Ordinal));
        }
        return Task.FromResult<IReadOnlyList<DoctorAccount>>(cuentas.OrderBy(c => c.NombreCompleto).ToList());
    }

    public Task<DoctorAccount?> ObtenerCuentaAsync(int idMedico, CancellationToken cancellationToken = default) =>
        Task.FromResult(Cuentas().FirstOrDefault(c => c.IdMedico == idMedico));

    public async Task<DoctorUpdateResult> ActualizarDatosAsync(
        int idMedico, string nombreCompleto, string especialidad, string cedulaProfesional, string rol,
        CancellationToken cancellationToken = default)
    {
        var cuenta = CuentaDeMedico(idMedico);
        if (cuenta is null) return DoctorUpdateResult.NoEncontrado;

        var medico = Medicos.First(m => m.Id == idMedico);
        medico.NombreCompleto = nombreCompleto;
        medico.Especialidad = especialidad;
        medico.CedulaProfesional = cedulaProfesional;
        cuenta.Rol = rol;
        return DoctorUpdateResult.Actualizado((await ObtenerCuentaAsync(idMedico, cancellationToken))!);
    }

    public Task<bool> EliminarAsync(int idMedico, CancellationToken cancellationToken = default)
    {
        var cuenta = CuentaDeMedico(idMedico);
        if (cuenta is null) return Task.FromResult(false);
        Usuarios.Remove(cuenta);
        Medicos.RemoveAll(m => m.Id == idMedico);
        return Task.FromResult(true);
    }

    public Task<bool> ActualizarPasswordAsync(int idMedico, string nuevoHash, CancellationToken cancellationToken = default)
    {
        var usuario = CuentaDeMedico(idMedico);
        if (usuario is null) return Task.FromResult(false);
        usuario.PasswordHash = nuevoHash;
        return Task.FromResult(true);
    }

    public Task<bool> CambiarEstadoAsync(int idMedico, bool activo, CancellationToken cancellationToken = default)
    {
        var usuario = CuentaDeMedico(idMedico);
        if (usuario is null) return Task.FromResult(false);
        usuario.Activo = activo;
        return Task.FromResult(true);
    }

    private User? CuentaDeMedico(int idMedico) =>
        Usuarios.FirstOrDefault(u => u.Id == idMedico && UserRoles.EsMedico(u.Rol) && Medicos.Any(m => m.Id == idMedico));

    private IEnumerable<DoctorAccount> Cuentas() =>
        from m in Medicos
        join u in Usuarios on (int?)m.Id equals u.IdMedico
        where UserRoles.EsMedico(u.Rol)
        select new DoctorAccount(m.Id, m.NombreCompleto, m.Especialidad, m.CedulaProfesional, u.Rol, u.Activo, u.FechaRegistro);
}
