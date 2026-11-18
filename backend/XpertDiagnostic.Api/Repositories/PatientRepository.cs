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
               select new PatientSummary(p.Id, p.NombreCompleto, p.Edad, e == null ? null : e.Nombre))
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
}
