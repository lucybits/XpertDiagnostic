using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>Enfermedad de la base de conocimiento (tabla <c>ENFERMEDADES</c>).</summary>
/// <remarks>@inv Id con el formato del CSV, p. ej. "CARDI00017"; Nombre no vacío.</remarks>
[Table("ENFERMEDADES")]
public class Disease
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("Id_Enfermedad", TypeName = "varchar(10)")]
    public string Id { get; set; } = string.Empty;

    [StringLength(150)]
    public string Nombre { get; set; } = string.Empty;
}
