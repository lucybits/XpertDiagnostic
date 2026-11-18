namespace XpertDiagnostic.Api.Models.Results;

/// <summary>
/// Estado de la conexión con SQL Server.
/// </summary>
/// <remarks>
/// @inv Conectado == false implica Usuarios == null.
/// </remarks>
public sealed record DatabaseStatus(bool Conectado, int? Usuarios);
