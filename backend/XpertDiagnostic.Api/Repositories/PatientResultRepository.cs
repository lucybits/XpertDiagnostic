using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IPatientResultRepository"/> con Entity Framework Core (solo lectura, P-164).</summary>
public sealed class PatientResultRepository(AppDbContext db) : IPatientResultRepository
{
    public async Task<PatientOutputRow?> ObtenerSalidaAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        var fila = await (
            from p in db.Pacientes.AsNoTracking()
            join e in db.Enfermedades on p.IdEnfermedadDiagnosticada equals e.Id into diagnosticos
            from e in diagnosticos.DefaultIfEmpty()
            join m in db.Medicos on p.IdMedicoValidador equals (int?)m.Id into validadores
            from m in validadores.DefaultIfEmpty()
            where p.Id == idPaciente
            select new
            {
                p.Id,
                p.NombreCompleto,
                p.FechaNacimiento,
                p.IdEnfermedadDiagnosticada,
                Diagnostico = e == null ? null : e.Nombre,
                p.IdTratamiento,
                p.IdPlan,
                p.EstadoValidacion,
                p.FechaValidacion,
                ValidadoPor = m == null ? null : m.NombreCompleto,
            }).FirstOrDefaultAsync(cancellationToken);

        if (fila is null) return null;
        var resumen = new PatientSummary(
            fila.Id,
            fila.NombreCompleto,
            fila.FechaNacimiento,
            fila.Diagnostico,
            ValidationStates.Efectivo(fila.EstadoValidacion),
            fila.ValidadoPor);
        return new PatientOutputRow(resumen, fila.IdEnfermedadDiagnosticada, fila.Diagnostico, fila.IdTratamiento, fila.IdPlan, fila.FechaValidacion);
    }

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
}
