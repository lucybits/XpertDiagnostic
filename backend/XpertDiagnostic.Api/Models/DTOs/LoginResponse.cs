
namespace XpertDiagnostic.Api.Models.DTOs;

public class LoginResponse
{
    public int UsuarioId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEn { get; set; }
}
