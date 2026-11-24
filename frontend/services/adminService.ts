import { deleteJson, getJson, postJson, putJson, type ApiResponse } from '@/lib/apiClient';
import type { AdminFailure, AdminResult, DoctorAccount } from '@/types/admin';
import type { DoctorRegistration, DoctorUpdate } from '@/types/doctor';

/**
 * Operaciones del panel de administración (ESP-007). La vista solo conoce estas funciones; no sabe
 * de URLs, códigos HTTP ni cookies. Todas pasan por las rutas /api/admin/* de Next.js, que validan
 * y reenvían al backend con el token de la cookie httpOnly. El backend exige rol de administrador.
 *
 * @post Ninguna lanza: devuelven { ok: true, data } o { ok: false, reason, message? }.
 */

const BASE = '/api/admin/doctors';

/** Médicos registrados; query filtra por nombre, especialidad, ID o cédula. */
export function listDoctors(query = ''): Promise<AdminResult<DoctorAccount[]>> {
  const search = query.trim();
  return run(() => getJson<DoctorAccount[]>(search ? `${BASE}?q=${encodeURIComponent(search)}` : BASE));
}

/** @pre data ya pasó validateDoctorRegistration. @post 409 → 'conflict' con el mensaje (ID o cédula repetidos). */
export function createDoctor(data: DoctorRegistration): Promise<AdminResult<DoctorAccount>> {
  return run(() => postJson<DoctorAccount>(BASE, data));
}

/** @pre data ya pasó validateDoctorUpdate. @post 409 → 'conflict' (cédula de otro médico); 404 → 'not-found'. */
export function updateDoctor(idMedico: number, data: DoctorUpdate): Promise<AdminResult<DoctorAccount>> {
  return run(() => putJson<DoctorAccount>(`${BASE}/${idMedico}`, data));
}

/** @pre password ya pasó validateNewPassword. */
export function resetDoctorPassword(idMedico: number, password: string): Promise<AdminResult<null>> {
  return run(() => putJson<null>(`${BASE}/${idMedico}/password`, { password }), true);
}

/** Activa o desactiva la cuenta (baja lógica: no se borra nada). */
export function setDoctorStatus(idMedico: number, activo: boolean): Promise<AdminResult<DoctorAccount>> {
  return run(() => putJson<DoctorAccount>(`${BASE}/${idMedico}/status`, { activo }));
}

/** Elimina de forma definitiva al médico y su cuenta (P-144). @post 404 → 'not-found'. */
export function deleteDoctor(idMedico: number): Promise<AdminResult<null>> {
  return run(() => deleteJson<null>(`${BASE}/${idMedico}`), true);
}

/** Elimina de forma definitiva al paciente y su expediente (P-144). @post 404 → 'not-found'. */
export function deletePatient(idPaciente: string): Promise<AdminResult<null>> {
  return run(() => deleteJson<null>(`/api/patients/${encodeURIComponent(idPaciente)}`), true);
}

/**
 * Cambia la contraseña del usuario con sesión (requiere la actual).
 * @post 400 → 'invalid-request' con el mensaje del servidor (por ejemplo, contraseña actual incorrecta).
 */
export function changeOwnPassword(passwordActual: string, passwordNueva: string): Promise<AdminResult<null>> {
  return run(() => putJson<null>('/api/session/password', { passwordActual, passwordNueva }), true);
}

const FAILURE_BY_STATUS: Record<number, AdminFailure> = {
  400: 'invalid-request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
};

async function run<T>(request: () => Promise<ApiResponse<T>>, allowEmpty = false): Promise<AdminResult<T>> {
  try {
    const response = await request();
    if (response.ok && (response.data !== null || allowEmpty)) return { ok: true, data: response.data as T };

    const message = (response.data as { error?: unknown } | null)?.error;
    return {
      ok: false,
      reason: FAILURE_BY_STATUS[response.status] ?? 'unavailable',
      message: typeof message === 'string' ? message : undefined,
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
