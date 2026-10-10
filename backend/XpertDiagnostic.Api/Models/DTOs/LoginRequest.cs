
using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

public class LoginRequest
{
    [Range(1, int.MaxValue)]
    public int UsuarioId { get; set; }

    [Required]
    [StringLength(72, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}
