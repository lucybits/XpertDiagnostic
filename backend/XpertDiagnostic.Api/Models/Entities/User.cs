using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Modelo de dominio: usuario registrado en la tabla <c>USUARIOS</c>.
/// </summary>
/// <remarks>
/// @inv Id &gt; 0 (cédula o identificador asignado por la institución).
/// @inv PasswordHash no está vacío y mide como máximo 60 caracteres
///      (hash BCrypt o, mientras se migra, contraseña heredada).
/// @inv Rol es UserRoles.MedicoTratante ("T"), UserRoles.MedicoInternista ("I") o UserRoles.Administrador ("A").
/// @inv Rol T o I ⇒ IdMedico == Id y apunta a un registro de MEDICOS (CK_USUARIOS_MEDICO_ROL/_ID).
/// @inv Rol == Administrador ⇒ IdMedico puede ser null (cuenta sin registro de médico, P-116).
/// @inv Activo == false ⇒ la cuenta no puede iniciar sesión ni usar un token ya emitido.
/// </remarks>
[Table("USUARIOS")]
public class User
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("Id_Usuario")]
    public int Id { get; set; }

    [StringLength(60)]
    [Column("PASS", TypeName = "varchar(60)")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("ROL")]
    public string Rol { get; set; } = string.Empty;

    [Column("Id_Medico")]
    public int? IdMedico { get; set; }

    /// <summary>Área de trabajo heredada del esquema anterior; opcional y sin tabla asociada.</summary>
    [Column("Id_Area")]
    public int? IdArea { get; set; }

    /// <summary>true cuando el usuario ya completó la bienvenida guiada del asistente (ESP-003).</summary>
    public bool BienvenidaVista { get; set; }

    /// <summary>false cuando el administrador desactivó la cuenta (baja lógica: no se borra nada).</summary>
    public bool Activo { get; set; } = true;

    /// <summary>Alta de la cuenta en UTC. La pone SQL Server (DF_USUARIOS_FECHA_REGISTRO).</summary>
    public DateTime FechaRegistro { get; set; }
}
