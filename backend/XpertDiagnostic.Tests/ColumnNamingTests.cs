using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using XpertDiagnostic.Api.Data;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Las columnas de llave de la base se llaman Id_Xxx (Id_Paciente, Id_Medico, ...). Las propiedades de C#
/// conservan su nombre (IdPaciente, Id) y se mapean con [Column("Id_...")].
/// </summary>
public class ColumnNamingTests
{
    [Fact]
    public void Modelo_ColumnasDeLlave_UsanGuionBajoDespuesDeId()
    {
        // Given el modelo de EF Core (no se conecta a la base: solo se construye el modelo)
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=.;Database=SinConexion;Trusted_Connection=True").Options);

        // When se leen los nombres de columna de todas las entidades
        var columnas = db.Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties().Select(p => new
            {
                Tabla = e.GetTableName(),
                Columna = p.GetColumnName(StoreObjectIdentifier.Table(e.GetTableName()!, e.GetSchema())),
            }))
            .ToList();

        // Then ninguna usa el formato viejo IdXxx, y las de llave existen con Id_
        var viejas = columnas.Where(c => Regex.IsMatch(c.Columna!, "^Id[A-Z]")).Select(c => $"{c.Tabla}.{c.Columna}");
        Assert.Empty(viejas);
        Assert.Contains(columnas, c => c.Tabla == "PACIENTES" && c.Columna == "Id_Paciente");
        Assert.Contains(columnas, c => c.Tabla == "USUARIOS" && c.Columna == "Id_Medico");
    }
}
