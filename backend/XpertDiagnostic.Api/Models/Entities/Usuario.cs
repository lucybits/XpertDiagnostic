using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

[Table("USUARIOS")]
public class Usuario
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("IdUSUARIO")]
    public int Id { get; set; }

    [Column("PASS")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("ROL")]
    public string Rol { get; set; } = string.Empty;

    [Column("IdMEDICO")]
    public int IdMedico { get; set; }

    [Column("IdAREA")]
    public int IdArea { get; set; }
}