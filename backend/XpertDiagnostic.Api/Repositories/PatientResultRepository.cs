using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IPatientResultRepository"/> con Entity Framework Core.</summary>
public sealed class PatientResultRepository(AppDbContext db) : IPatientResultRepository
{
    private const int ViolacionLlavePrimaria = 2627;

    public Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        (from p in db.Pacientes.AsNoTracking()
         join e in db.Enfermedades on p.IdEnfermedadDiagnosticada equals e.Id into diagnosticos
         from e in diagnosticos.DefaultIfEmpty()
         where p.Id == idPaciente
         select new PatientOutputRow(
             new PatientSummary(p.Id, p.NombreCompleto, p.Edad, e == null ? null : e.Nombre),
             p.IdEnfermedadDiagnosticada,
             e == null ? null : e.Nombre,
             p.IdTratamiento,
             p.IdPlan))
        .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExisteEnfermedadAsync(string idEnfermedad, CancellationToken cancellationToken = default) =>
        db.Enfermedades.AnyAsync(e => e.Id == idEnfermedad, cancellationToken);

    public async Task<IReadOnlyList<TreatmentView>> ListarTratamientosAsync(
        string idEnfermedad,
        CancellationToken cancellationToken = default) =>
        await db.Tratamientos.AsNoTracking()
            .Where(t => t.IdEnfermedad == idEnfermedad)
            .OrderBy(t => t.Id)
            .Select(t => new TreatmentView(t.Id, t.Descripcion, t.DosisMinima, t.DosisMaxima, t.Unidades))
            .ToListAsync(cancellationToken);

    public Task<CarePlanView?> ObtenerPlanAsync(string idPlan, CancellationToken cancellationToken = default) =>
        db.Planes.AsNoTracking()
            .Where(p => p.Id == idPlan)
            .Select(p => new CarePlanView(p.Id, p.PlanIndicado, p.Pronostico, p.Seguimiento))
            .FirstOrDefaultAsync(cancellationToken);

    public Task AsignarDiagnosticoAsync(
        string idPaciente,
        string idEnfermedad,
        string? idTratamiento,
        CancellationToken cancellationToken = default) =>
        db.Pacientes.Where(p => p.Id == idPaciente).ExecuteUpdateAsync(set => set
            .SetProperty(p => p.IdEnfermedadDiagnosticada, idEnfermedad)
            .SetProperty(p => p.IdTratamiento, idTratamiento), cancellationToken);

    public Task AsignarTratamientoAsync(string idPaciente, string idTratamiento, CancellationToken cancellationToken = default) =>
        db.Pacientes.Where(p => p.Id == idPaciente)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.IdTratamiento, idTratamiento), cancellationToken);

    public Task<string?> ObtenerUltimoIdPlanAsync(CancellationToken cancellationToken = default) =>
        // Ancho fijo (PLAN_ + 5 dígitos): el orden de texto es el numérico.
        db.Planes.AsNoTracking()
            .Where(p => p.Id.StartsWith("PLAN_"))
            .OrderByDescending(p => p.Id)
            .Select(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<bool> CrearPlanAsync(string idPaciente, CarePlan plan, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(plan);
        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            db.Planes.Add(plan);
            await db.SaveChangesAsync(cancellationToken);
            await db.Pacientes.Where(p => p.Id == idPaciente)
                .ExecuteUpdateAsync(set => set.SetProperty(p => p.IdPlan, plan.Id), cancellationToken);
            await transaccion.CommitAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: ViolacionLlavePrimaria })
        {
            await transaccion.RollbackAsync(cancellationToken);
            return false;
        }
        finally
        {
            db.ChangeTracker.Clear();
        }
    }

    public Task ActualizarPlanAsync(CarePlan plan, CancellationToken cancellationToken = default) =>
        db.Planes.Where(p => p.Id == plan.Id).ExecuteUpdateAsync(set => set
            .SetProperty(p => p.PlanIndicado, plan.PlanIndicado)
            .SetProperty(p => p.Pronostico, plan.Pronostico)
            .SetProperty(p => p.Seguimiento, plan.Seguimiento), cancellationToken);
}
