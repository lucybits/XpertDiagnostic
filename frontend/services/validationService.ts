import { getJson, postJson, putJson } from '@/lib/apiClient';
import type { RecordResult } from './recordService';
import type { ValidationDetail, ValidationState, ValidationSummary } from '@/types/validation';

/** Validación del diagnóstico por el médico internista (P-151). Ninguna función lanza. */

const MESSAGES: Record<number, string> = {
  400: 'Ese diagnóstico ya no es uno de los candidatos. Actualiza la lista e inténtalo de nuevo.',
  401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  403: 'Tu cuenta no tiene permiso para esta acción.',
  404: 'No se encontró al paciente.',
};

async function call<T>(request: () => Promise<{ ok: boolean; status: number; data: T | null }>): Promise<RecordResult<T>> {
  try {
    const response = await request();
    if (response.ok && response.data) return { ok: true, data: response.data };
    // 409: el backend explica el motivo (sin candidatos, ya no está pendiente).
    const backendMessage = (response.data as { error?: unknown } | null)?.error;
    const message =
      response.status === 409 && typeof backendMessage === 'string'
        ? backendMessage
        : (MESSAGES[response.status] ?? 'No se pudo completar. Inténtalo de nuevo en un momento.');
    return { ok: false, message };
  } catch {
    return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
  }
}

/** Estado de la validación de un paciente (aviso del médico tratante). */
export const getValidationStatus = (patientId: string) =>
  call(() => getJson<ValidationSummary>(`/api/patients/${patientId}/validation`));

/** El médico tratante envía el diagnóstico diferencial al médico internista. */
export const sendToValidation = (patientId: string) =>
  call(() => postJson<ValidationSummary>(`/api/patients/${patientId}/validation`, {}));

/** Pacientes pendientes o confirmados, para la pantalla del médico internista. */
export const listValidations = (state: ValidationState) =>
  call(() => getJson<ValidationSummary[]>(`/api/validations?estado=${state}`));

/** Paciente, hallazgos y diagnóstico diferencial actual, para que el internista decida. */
export const getValidationDetail = (patientId: string) =>
  call(() => getJson<ValidationDetail>(`/api/validations/${patientId}`));

/** El médico internista confirma uno de los candidatos. */
export const confirmValidation = (patientId: string, diseaseId: string) =>
  call(() => putJson<ValidationSummary>(`/api/validations/${patientId}`, { idEnfermedad: diseaseId }));
