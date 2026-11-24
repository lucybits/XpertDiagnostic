using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="IPatientRecordRepository"/> con Entity Framework Core.</summary>
public sealed class PatientRecordRepository(AppDbContext db) : IPatientRecordRepository
{
    public Task<bool> ExistePacienteAsync(string idPaciente, CancellationToken cancellationToken = default) =>
        db.Pacientes.AnyAsync(p => p.Id == idPaciente, cancellationToken);

    public async Task<IReadOnlyList<FindingView>> ListarHallazgosAsync(
        string idPaciente,
        CancellationToken cancellationToken = default) =>
        // Interpolación de FormattableString: EF Core envía idPaciente como parámetro, no como texto.
        await db.Database.SqlQuery<FindingView>($"""
            SELECT h.TipoHallazgo, h.Id_Registro AS IdRegistro,
                   COALESCE(s.Descripcion, g.Descripcion, l.Descripcion, c.Descripcion,
                            d.Descripcion, x.Complicac, h.Id_Registro) AS Descripcion,
                   h.Valor, h.Unidades
            FROM dbo.HALLAZGOS_PACIENTE h
            LEFT JOIN dbo.SINTOMAS s ON h.TipoHallazgo = 'Sintoma' AND s.Id_Sintoma = h.Id_Registro
            LEFT JOIN dbo.SIGNOS g ON h.TipoHallazgo = 'Signo' AND g.Id_Signo = h.Id_Registro
            LEFT JOIN dbo.ESTUDIOS_LABORATORIO l ON h.TipoHallazgo = 'Estudio_lab' AND l.Id_Estudio = h.Id_Registro
            LEFT JOIN dbo.COMORBILIDADES c ON h.TipoHallazgo = 'Comorbilidad' AND c.Id_Comorbilidad = h.Id_Registro
            LEFT JOIN dbo.ESTUDIOS_DIAGNOSTICO_DIFERENCIAL d ON h.TipoHallazgo = 'Estudio_diagdif' AND d.Id_Estudio = h.Id_Registro
            LEFT JOIN dbo.IO_Complicaciones x ON h.TipoHallazgo = 'Complicacion' AND x.Id_Complic = h.Id_Registro
            WHERE h.Id_Paciente = {idPaciente}
            ORDER BY h.TipoHallazgo, h.Id_Registro
            """).ToListAsync(cancellationToken);

    public async Task ReemplazarHallazgosAsync(
        string idPaciente,
        string tipoHallazgo,
        IReadOnlyList<PatientFinding> hallazgos,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(hallazgos);

        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.Hallazgos
            .Where(h => h.IdPaciente == idPaciente && h.TipoHallazgo == tipoHallazgo)
            .ExecuteDeleteAsync(cancellationToken);
        db.Hallazgos.AddRange(hallazgos);
        await db.SaveChangesAsync(cancellationToken);
        await transaccion.CommitAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }
}