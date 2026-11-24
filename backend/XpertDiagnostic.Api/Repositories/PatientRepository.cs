using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IPatientRepository"/> con Entity Framework Core.</summary>
public sealed class PatientRepository(AppDbContext db) : IPatientRepository
{
    private const int ViolacionLlavePrimaria = 2627;

    public async Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default) =>
        await (from p in db.Pacientes.AsNoTracking()
               join e in db.Enfermedades on p.IdEnfermedadDiagnosticada equals e.Id into diagnosticos
               from e in diagnosticos.DefaultIfEmpty()
               orderby p.Id
               select new PatientSummary(p.Id, p.NombreCompleto, p.FechaNacimiento, e == null ? null : e.Nombre))
            .ToListAsync(cancellationToken);

    public Task<string?> ObtenerUltimoIdAsync(CancellationToken cancellationToken = default) =>
        // Los ID tienen ancho fijo (PACIE + 5 dígitos), así que el orden de texto es el numérico.
        db.Pacientes.AsNoTracking()
            .Where(p => p.Id.StartsWith("PACIE"))
            .OrderByDescending(p => p.Id)
            .Select(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<bool> CrearAsync(Patient paciente, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(paciente);
        ArgumentException.ThrowIfNullOrWhiteSpace(paciente.Id);

        db.Pacientes.Add(paciente);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: ViolacionLlavePrimaria })
        {
            db.ChangeTracker.Clear();
            return false;
        }
    }

    public async Task<bool> EliminarAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);

        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);

        var idPlan = await db.Pacientes
            .Where(p => p.Id == idPaciente)
            .Select(p => new { p.IdPlan })
            .FirstOrDefaultAsync(cancellationToken);
        if (idPlan is null)
            return false;

        // Primero lo que apunta al paciente (llaves foráneas), después el paciente y al final su plan.
        await db.Hallazgos.Where(h => h.IdPaciente == idPaciente).ExecuteDeleteAsync(cancellationToken);
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM dbo.ATENCIONES_PACIENTE WHERE IdPaciente = {idPaciente}", cancellationToken);
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM dbo.RESULTADOS_ESPERADOS WHERE IdPaciente = {idPaciente}", cancellationToken);
        await db.Pacientes.Where(p => p.Id == idPaciente).ExecuteDeleteAsync(cancellationToken);

        if (idPlan.IdPlan is not null && !await db.Pacientes.AnyAsync(p => p.IdPlan == idPlan.IdPlan, cancellationToken))
            await db.Planes.Where(p => p.Id == idPlan.IdPlan).ExecuteDeleteAsync(cancellationToken);

        await transaccion.CommitAsync(cancellationToken);
        return true;
    }
}
