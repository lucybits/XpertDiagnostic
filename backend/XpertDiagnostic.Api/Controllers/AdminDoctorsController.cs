using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Panel de administración: alta y gestión de las cuentas de médicos (P-116).
/// Solo administradores con cuenta activa (401 sin token válido, 403 con otro rol).
/// Solo traduce HTTP ↔ servicio; la lógica vive en <see cref="IDoctorService"/> y
/// <see cref="IDoctorAdministrationService"/>.
/// </summary>
[ApiController]
[Route("api/admin/doctors")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.Administrador)]
public class AdminDoctorsController(IDoctorService registro, IDoctorAdministrationService administracion) : ControllerBase
{
    private const string MensajeNoEncontrado = "No se encontró al médico.";
    private const string MensajeCedulaDuplicada = "Ya existe un médico con esa cédula profesional.";

    /// <summary>Médicos registrados, con el estado de su cuenta.</summary>
    /// <remarks>@post 200 con la lista ordenada por nombre (puede estar vacía); q filtra por nombre, especialidad, ID o cédula.</remarks>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DoctorAccount>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DoctorAccount>>> List(
        [FromQuery] string? q,
        CancellationToken cancellationToken) =>
        Ok(await administracion.ListarAsync(q, cancellationToken));

    /// <summary>Un médico por su ID.</summary>
    /// <remarks>@post 200 con la cuenta; 404 si no existe.</remarks>
    [HttpGet("{id:int:min(1)}")]
    [ProducesResponseType<DoctorAccount>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DoctorAccount>> Get(int id, CancellationToken cancellationToken)
    {
        var cuenta = await administracion.ObtenerAsync(id, cancellationToken);
        return cuenta is null ? NotFound(new ErrorResponse(MensajeNoEncontrado)) : Ok(cuenta);
    }

    /// <summary>Registra un médico y crea su cuenta (rol médico, activa).</summary>
    /// <remarks>
    /// @pre request cumple <see cref="CreateDoctorRequest"/>.
    /// @post 201 con la cuenta creada; 409 si el ID o la cédula ya existen (sin guardar nada).
    /// </remarks>
    [HttpPost]
    [ProducesResponseType<DoctorAccount>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DoctorAccount>> Create(
        [FromBody] CreateDoctorRequest request,
        CancellationToken cancellationToken)
    {
        var resultado = await registro.RegistrarAsync(request, cancellationToken);

        return resultado.Estado switch
        {
            DoctorRegistrationStatus.Creado =>
                CreatedAtAction(nameof(Get), new { id = resultado.Cuenta!.IdMedico }, resultado.Cuenta),
            DoctorRegistrationStatus.CedulaDuplicada => Conflict(new ErrorResponse(MensajeCedulaDuplicada)),
            _ => Conflict(new ErrorResponse("Ya existe un médico o una cuenta con ese ID."))
        };
    }

    /// <summary>Edita nombre, especialidad y cédula de un médico.</summary>
    /// <remarks>@post 200 con la cuenta actualizada; 404 si no existe; 409 si la cédula es de otro médico.</remarks>
    [HttpPut("{id:int:min(1)}")]
    [ProducesResponseType<DoctorAccount>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DoctorAccount>> Update(
        int id,
        [FromBody] UpdateDoctorRequest request,
        CancellationToken cancellationToken)
    {
        var resultado = await administracion.ActualizarAsync(id, request, cancellationToken);

        return resultado.Estado switch
        {
            DoctorUpdateStatus.Actualizado => Ok(resultado.Cuenta),
            DoctorUpdateStatus.CedulaDuplicada => Conflict(new ErrorResponse(MensajeCedulaDuplicada)),
            _ => NotFound(new ErrorResponse(MensajeNoEncontrado))
        };
    }

    /// <summary>Asigna una contraseña nueva a la cuenta del médico.</summary>
    /// <remarks>@post 204 si se guardó; 404 si el médico no existe.</remarks>
    [HttpPut("{id:int:min(1)}/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(
        int id,
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken) =>
        await administracion.RestablecerPasswordAsync(id, request.Password, cancellationToken)
            ? NoContent()
            : NotFound(new ErrorResponse(MensajeNoEncontrado));

    /// <summary>Activa o desactiva la cuenta del médico (no borra datos).</summary>
    /// <remarks>@post 200 con la cuenta y su estado nuevo; 404 si el médico no existe.</remarks>
    [HttpPut("{id:int:min(1)}/status")]
    [ProducesResponseType<DoctorAccount>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DoctorAccount>> UpdateStatus(
        int id,
        [FromBody] UpdateAccountStatusRequest request,
        CancellationToken cancellationToken)
    {
        var cuenta = await administracion.CambiarEstadoAsync(id, request.Activo!.Value, cancellationToken);
        return cuenta is null ? NotFound(new ErrorResponse(MensajeNoEncontrado)) : Ok(cuenta);
    }
}
