
using XpertDiagnostic.Api.Models.DTOs;

namespace XpertDiagnostic.Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(int usuarioId, string password);
}
