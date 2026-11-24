using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Paciente de la tabla <c>PACIENTES</c>. Es una tabla de entrada y salida (ESP-004, P-102):
/// el administrador da de alta al paciente (nombre(s), apellidos y fecha de nacimiento, P-144), el
/// médico tratante captura sus hallazgos y la máquina de inferencia llena la enfermedad diagnosticada,
/// el tratamiento y el plan.
/// </summary>
/// <remarks>
/// @inv Id tiene el formato PACIE + 5 dígitos (VARCHAR(10)).
/// @inv NombreCompleto de 3 a 150 caracteres: Nombres + ApellidoPaterno + ApellidoMaterno.
/// @inv Nombres, ApellidoPaterno y ApellidoMaterno pueden ser null solo en pacientes anteriores a P-144.
/// @inv FechaNacimiento no es anterior a 1890-01-01 (CK_PACIENTES_FECHA_NACIMIENTO). La edad se calcula.
/// </remarks>
[Table("PACIENTES")]
public class Patient
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("IdPaciente", TypeName = "varchar(10)")]
    public string Id { get; set; } = string.Empty;

    [StringLength(150)]
    public string NombreCompleto { get; set; } = string.Empty;

    [StringLength(60)]
    public string? Nombres { get; set; }

    [StringLength(40)]
    public string? ApellidoPaterno { get; set; }

    [StringLength(40)]
    public string? ApellidoMaterno { get; set; }

    public DateOnly FechaNacimiento { get; set; }

    // ── Salida de la máquina de inferencia (null hasta que exista un diagnóstico) ──
    [Column(TypeName = "varchar(10)")]
    public string? IdEnfermedadDiagnosticada { get; set; }

    // ── Entradas que se capturan en el chat ──
    [Column(TypeName = "varchar(10)")]
    public string? IdEnfermedadPreexistente { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string? IdComorbilidad { get; set; }

    // ── Salida de la máquina de inferencia ──
    [Column(TypeName = "varchar(20)")]
    public string? IdTratamiento { get; set; }

    [Column(TypeName = "varchar(10)")]
    public string? IdPlan { get; set; }
}
