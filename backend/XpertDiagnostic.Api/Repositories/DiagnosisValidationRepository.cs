using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IDiagnosisValidationRepository"/> con Entity Framework Core.</summary>
public sealed class DiagnosisValidationRepository(AppDbContext db) : IDiagnosisValidationRepository
{
    /// <summary>Máximo de confirmados que se listan (los más recientes).</summary>
    private const int MaximoConfirmados = 50;

    public Task<ValidationRow?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        db.Pacientes.AsNoTracking()
            .Where(p => p.Id == idPaciente)
            .Select(p => new ValidationRow(p.EstadoValidacion, p.IdEnfermedadDiagnosticada, p.IdTratamiento))
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<ValidationSummary?> ObtenerResumenAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        (await Resumenes(db.Pacientes.AsNoTracking().Where(p => p.Id == idPaciente), cancellationToken)).FirstOrDefault();

    public async Task<IReadOnlyList<ValidationSummary>> ListarAsync(string estado, CancellationToken cancellationToken = default)
    {
        if (!ValidationStates.EsValido(estado))
            throw new ArgumentOutOfRangeException(nameof(estado), estado, "El estado debe ser P o C.");

        var pacientes = db.Pacientes.AsNoTracking().Where(p => p.EstadoValidacion == estado);
        if (estado == ValidationStates.Pendiente)
        {
            // Los pendientes se atienden por orden de llegada.
            var pendientes = await Resumenes(pacientes, cancellationToken);
            return [.. pendientes.OrderBy(r => r.FechaSolicitud).ThenBy(r => r.IdPaciente, StringComparer.Ordinal)];
        }

        // Los confirmados: solo los más recientes. Los JOIN no garantizan el orden, así que se ordena otra vez en memoria.
        var recientes = await Resumenes(
            pacientes.OrderByDescending(p => p.FechaValidacion).ThenBy(p => p.Id).Take(MaximoConfirmados),
            cancellationToken);
        return [.. recientes.OrderByDescending(r => r.FechaValidacion).ThenBy(r => r.IdPaciente, StringComparer.Ordinal)];
    }

    public Task SolicitarAsync(string idPaciente, int idTratante, DateTime fechaUtc, CancellationToken cancellationToken = default) =>
        db.Pacientes.Where(p => p.Id == idPaciente).ExecuteUpdateAsync(set => set
            .SetProperty(p => p.EstadoValidacion, ValidationStates.Pendiente)
            .SetProperty(p => p.IdMedicoSolicitante, idTratante)
            .SetProperty(p => p.FechaSolicitud, fechaUtc)
            .SetProperty(p => p.IdMedicoValidador, (int?)null)
            .SetProperty(p => p.FechaValidacion, (DateTime?)null), cancellationToken);

    public Task ConfirmarAsync(
        string idPaciente,
        string idEnfermedad,
        string? idTratamiento,
        int idInternista,
        DateTime fechaUtc,
        CancellationToken cancellationToken = default) =>
        db.Pacientes.Where(p => p.Id == idPaciente).ExecuteUpdateAsync(set => set
            .SetProperty(p => p.IdEnfermedadDiagnosticada, idEnfermedad)
            .SetProperty(p => p.IdTratamiento, idTratamiento)
            .SetProperty(p => p.EstadoValidacion, ValidationStates.Confirmado)
            .SetProperty(p => p.IdMedicoValidador, idInternista)
            .SetProperty(p => p.FechaValidacion, fechaUtc), cancellationToken);

    /// <summary>
    /// Resumen de cada paciente de la consulta (sin orden garantizado). Se proyecta a un tipo anónimo y se
    /// arma en memoria: la edad y el estado efectivo se calculan en C#.
    /// </summary>
    private async Task<IReadOnlyList<ValidationSummary>> Resumenes(
        IQueryable<Models.Entities.Patient> pacientes,
        CancellationToken cancellationToken)
    {
        var filas = await (
            from p in pacientes
            join e in db.Enfermedades on p.IdEnfermedadDiagnosticada equals e.Id into diagnosticos
            from e in diagnosticos.DefaultIfEmpty()
            join s in db.Medicos on p.IdMedicoSolicitante equals (int?)s.Id into solicitantes
            from s in solicitantes.DefaultIfEmpty()
            join v in db.Medicos on p.IdMedicoValidador equals (int?)v.Id into validadores
            from v in validadores.DefaultIfEmpty()
            select new
            {
                p.Id,
                p.NombreCompleto,
                p.FechaNacimiento,
                p.Sexo,
                p.EstadoValidacion,
                p.IdEnfermedadDiagnosticada,
                Solicitante = s == null ? null : s.NombreCompleto,
                p.FechaSolicitud,
                Validador = v == null ? null : v.NombreCompleto,
                p.FechaValidacion,
                Diagnostico = e == null ? null : e.Nombre,
            }).ToListAsync(cancellationToken);

        var hoy = DateOnly.FromDateTime(DateTime.Today);
        return filas
            .Select(f => new ValidationSummary(
                f.Id,
                f.NombreCompleto,
                PatientAge.EnAnios(f.FechaNacimiento, hoy),
                f.Sexo,
                ValidationStates.Efectivo(f.EstadoValidacion),
                f.Solicitante,
                f.FechaSolicitud,
                f.Validador,
                f.FechaValidacion,
                f.Diagnostico))
            .ToList();
    }
}
