using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Médico registrado en la tabla <c>MEDICOS</c>. Su cuenta en <c>USUARIOS</c> usa el mismo número.
/// </summary>
/// <remarks>
/// @inv Id &gt; 0.
/// @inv NombreCompleto y Especialidad no están vacíos.
/// @inv CedulaProfesional tiene 7 u 8 dígitos y es única.
/// </remarks>
[Table("MEDICOS")]
public class Doctor
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("IdMedico")]
    public int Id { get; set; }

    [StringLength(120)]
    public string NombreCompleto { get; set; } = string.Empty;

    [StringLength(80)]
    public string Especialidad { get; set; } = string.Empty;

    [StringLength(8)]
    [Column(TypeName = "varchar(8)")]
    public string CedulaProfesional { get; set; } = string.Empty;
}
