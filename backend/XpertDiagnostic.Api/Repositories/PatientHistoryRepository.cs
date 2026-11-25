using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IPatientHistoryRepository"/> con Entity Framework Core.</summary>
public sealed class PatientHistoryRepository(AppDbContext db) : IPatientHistoryRepository
{
    public Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        db.Pacientes.AnyAsync(p => p.Id == idPaciente, cancellationToken);

    public Task<NonPathologicalHistory?> ObtenerNoPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        db.AntecedentesNoPatologicos.AsNoTracking().FirstOrDefaultAsync(a => a.IdPaciente == idPaciente, cancellationToken);

    public Task<PathologicalHistory?> ObtenerPatologicosAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        db.AntecedentesPatologicos.AsNoTracking().FirstOrDefaultAsync(a => a.IdPaciente == idPaciente, cancellationToken);

    public async Task GuardarNoPatologicosAsync(NonPathologicalHistory antecedentes, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(antecedentes);
        var existe = await db.AntecedentesNoPatologicos.AnyAsync(a => a.IdPaciente == antecedentes.IdPaciente, cancellationToken);
        if (existe) db.AntecedentesNoPatologicos.Update(antecedentes);
        else db.AntecedentesNoPatologicos.Add(antecedentes);
        await GuardarAsync(cancellationToken);
    }

    public async Task GuardarPatologicosAsync(PathologicalHistory antecedentes, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(antecedentes);
        var existe = await db.AntecedentesPatologicos.AnyAsync(a => a.IdPaciente == antecedentes.IdPaciente, cancellationToken);
        if (existe) db.AntecedentesPatologicos.Update(antecedentes);
        else db.AntecedentesPatologicos.Add(antecedentes);
        await GuardarAsync(cancellationToken);
    }

    private async Task GuardarAsync(CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        finally
        {
            // El contexto vive por petición, pero no se deja la entidad en seguimiento.
            db.ChangeTracker.Clear();
        }
    }
}
