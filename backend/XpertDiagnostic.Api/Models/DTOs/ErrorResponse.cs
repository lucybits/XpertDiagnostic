namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Formato único de error que devuelve la API: <c>{ "error": "mensaje" }</c>.
/// El mensaje es apto para mostrarse al usuario y nunca incluye detalles internos.
/// </summary>
public sealed record ErrorResponse(string Error);
