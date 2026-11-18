/** Panel de administración (ESP-007): cuentas de médicos. */

/**
 * Médico con el estado de su cuenta, como lo devuelve GET /api/admin/doctors.
 * @inv Nunca incluye la contraseña ni su hash.
 */
export interface DoctorAccount {
  idMedico: number;
  nombreCompleto: string;
  especialidad: string;
  cedulaProfesional: string;
  activo: boolean;
  /** Fecha de alta en ISO 8601 (UTC). */
  fechaRegistro: string;
}

export type AdminFailure =
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'invalid-request'
  | 'unavailable'
  | 'network';

/** Resultado de una operación del panel. message trae el texto del servidor cuando lo hay (409, 400). */
export type AdminResult<T> = { ok: true; data: T } | { ok: false; reason: AdminFailure; message?: string };
