using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IDoctorRepository"/> con Entity Framework Core.</summary>
public sealed class DoctorRepository(AppDbContext db) : IDoctorRepository
{
    // Códigos de SQL Server para llave primaria o índice único repetido.
    private const int ViolacionLlavePrimaria = 2627;
    private const int ViolacionIndiceUnico = 2601;

    public async Task<bool> ExisteIdAsync(int id, CancellationToken cancellationToken = default) =>
        await db.Medicos.AnyAsync(m => m.Id == id, cancellationToken)
        || await db.Usuarios.AnyAsync(u => u.Id == id, cancellationToken);

    public Task<bool> ExisteCedulaAsync(string cedula, int? excluirIdMedico = null, CancellationToken cancellationToken = default) =>
        db.Medicos.AnyAsync(
            m => m.CedulaProfesional == cedula && (excluirIdMedico == null || m.Id != excluirIdMedico),
            cancellationToken);

    public async Task<bool> CrearConCuentaAsync(Doctor medico, User usuario, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(medico);
        ArgumentNullException.ThrowIfNull(usuario);

        db.Medicos.Add(medico);
        db.Usuarios.Add(usuario);

        try
        {
            // SaveChanges guarda ambos registros dentro de una misma transacción.
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (EsDuplicado(ex))
        {
            db.ChangeTracker.Clear();
            return false;
        }
    }

    public Task<DoctorProfile?> ObtenerPerfilAsync(int usuarioId, CancellationToken cancellationToken = default) =>
        (from u in db.Usuarios.AsNoTracking()
         join m in db.Medicos.AsNoTracking() on u.IdMedico equals (int?)m.Id into medicos
         from m in medicos.DefaultIfEmpty()
         where u.Id == usuarioId
         select new DoctorProfile(
             u.Id,
             u.Rol,
             m == null ? string.Empty : m.NombreCompleto,
             m == null ? string.Empty : m.Especialidad))
        .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<DoctorAccount>> ListarCuentasAsync(string? busqueda, CancellationToken cancellationToken = default)
    {
        var consulta = MedicosConCuenta();

        var texto = busqueda?.Trim();
        if (!string.IsNullOrEmpty(texto))
        {
            consulta = consulta.Where(c =>
                c.Medico.NombreCompleto.Contains(texto)
                || c.Medico.Especialidad.Contains(texto)
                || c.Medico.CedulaProfesional.StartsWith(texto)
                || c.Medico.Id.ToString().StartsWith(texto));
        }

        return await consulta
            .OrderBy(c => c.Medico.NombreCompleto)
            .ThenBy(c => c.Medico.Id)
            .Select(ACuenta)
            .ToListAsync(cancellationToken);
    }

    public Task<DoctorAccount?> ObtenerCuentaAsync(int idMedico, CancellationToken cancellationToken = default) =>
        MedicosConCuenta()
            .Where(c => c.Medico.Id == idMedico)
            .Select(ACuenta)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<DoctorUpdateResult> ActualizarDatosAsync(
        int idMedico,
        string nombreCompleto,
        string especialidad,
        string cedulaProfesional,
        string rol,
        CancellationToken cancellationToken = default)
    {
        if (!UserRoles.EsMedico(rol))
            throw new ArgumentException("El tipo de médico debe ser T o I.", nameof(rol));

        var registro = await (
            from m in db.Medicos
            join u in db.Usuarios on (int?)m.Id equals u.IdMedico
            where m.Id == idMedico && (u.Rol == UserRoles.MedicoTratante || u.Rol == UserRoles.MedicoInternista)
            select new { Medico = m, Cuenta = u }).FirstOrDefaultAsync(cancellationToken);

        if (registro is null)
            return DoctorUpdateResult.NoEncontrado;

        registro.Medico.NombreCompleto = nombreCompleto;
        registro.Medico.Especialidad = especialidad;
        registro.Medico.CedulaProfesional = cedulaProfesional;
        registro.Cuenta.Rol = rol;

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (EsDuplicado(ex))
        {
            // Otra solicitud guardó la misma cédula entre la verificación y este guardado.
            db.ChangeTracker.Clear();
            return DoctorUpdateResult.CedulaDuplicada;
        }

        var cuenta = await ObtenerCuentaAsync(idMedico, cancellationToken);
        return cuenta is null ? DoctorUpdateResult.NoEncontrado : DoctorUpdateResult.Actualizado(cuenta);
    }

    public async Task<bool> ActualizarPasswordAsync(int idMedico, string nuevoHash, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nuevoHash);

        var filas = await db.Usuarios
            .Where(u => u.Id == idMedico && (u.Rol == UserRoles.MedicoTratante || u.Rol == UserRoles.MedicoInternista))
            .ExecuteUpdateAsync(set => set.SetProperty(u => u.PasswordHash, nuevoHash), cancellationToken);
        return filas > 0;
    }

    public async Task<bool> CambiarEstadoAsync(int idMedico, bool activo, CancellationToken cancellationToken = default)
    {
        var filas = await db.Usuarios
            .Where(u => u.Id == idMedico && (u.Rol == UserRoles.MedicoTratante || u.Rol == UserRoles.MedicoInternista))
            .ExecuteUpdateAsync(set => set.SetProperty(u => u.Activo, activo), cancellationToken);
        return filas > 0;
    }

    public async Task<bool> EliminarAsync(int idMedico, CancellationToken cancellationToken = default)
    {
        // Ambos borrados en una transacción: o se van la cuenta y el médico, o no se borra nada.
        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);

        var cuentas = await db.Usuarios
            .Where(u => u.Id == idMedico && u.IdMedico == idMedico
                && (u.Rol == UserRoles.MedicoTratante || u.Rol == UserRoles.MedicoInternista))
            .ExecuteDeleteAsync(cancellationToken);
        if (cuentas == 0)
            return false;

        await db.Medicos.Where(m => m.Id == idMedico).ExecuteDeleteAsync(cancellationToken);
        await transaccion.CommitAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Médicos cuya cuenta es de rol médico, sin seguimiento de cambios (solo lectura). Se filtra y ordena
    /// sobre las entidades y se proyecta a <see cref="DoctorAccount"/> al final: EF no traduce filtros sobre
    /// un objeto creado con constructor.
    /// </summary>
    private IQueryable<MedicoConCuenta> MedicosConCuenta() =>
        from m in db.Medicos.AsNoTracking()
        join u in db.Usuarios.AsNoTracking() on (int?)m.Id equals u.IdMedico
        where u.Rol == UserRoles.MedicoTratante || u.Rol == UserRoles.MedicoInternista
        select new MedicoConCuenta { Medico = m, Cuenta = u };

    private static readonly System.Linq.Expressions.Expression<Func<MedicoConCuenta, DoctorAccount>> ACuenta = c =>
        new DoctorAccount(
            c.Medico.Id,
            c.Medico.NombreCompleto,
            c.Medico.Especialidad,
            c.Medico.CedulaProfesional,
            c.Cuenta.Rol,
            c.Cuenta.Activo,
            c.Cuenta.FechaRegistro);

    private sealed class MedicoConCuenta
    {
        public required Doctor Medico { get; init; }
        public required User Cuenta { get; init; }
    }

    private static bool EsDuplicado(DbUpdateException ex) =>
        ex.InnerException is SqlException { Number: ViolacionLlavePrimaria or ViolacionIndiceUnico };
}
