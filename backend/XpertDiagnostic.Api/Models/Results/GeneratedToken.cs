namespace XpertDiagnostic.Api.Models.Results;

/// <summary>
/// Token JWT emitido para un usuario y su fecha de expiración (UTC).
/// </summary>
public sealed record GeneratedToken(string Token, DateTime ExpiraEn);
