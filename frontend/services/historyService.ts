import { getJson, putJson } from '@/lib/apiClient';
import type { RecordResult } from './recordService';
import type { PathologicalHistory, PatientHistory } from '@/types/history';
import type { NonPathologicalHistory } from '@/types/patient';

/** Interrogatorio del paciente (P-159). Ninguna función lanza. */

const MESSAGES: Record<number, string> = {
  400: 'Algún dato no es válido. Revísalo e inténtalo de nuevo.',
  401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  403: 'Tu cuenta no tiene permiso para esta acción.',
  404: 'No se encontró al paciente.',
};

async function call<T>(request: () => Promise<{ ok: boolean; status: number; data: T | null }>): Promise<RecordResult<T>> {
  try {
    const response = await request();
    if (response.ok && response.data) return { ok: true, data: response.data };
    return { ok: false, message: MESSAGES[response.status] ?? 'No se pudo completar. Inténtalo de nuevo en un momento.' };
  } catch {
    return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
  }
}

/** Antecedentes guardados del paciente. */
export const getHistory = (patientId: string) => call(() => getJson<PatientHistory>(`/api/patients/${patientId}/history`));

/** Guarda los antecedentes no patológicos (siete respuestas sí/no). */
export const saveNonPathological = (patientId: string, data: NonPathologicalHistory) =>
  call(() => putJson<PatientHistory>(`/api/patients/${patientId}/history/no-patologicos`, data));

/** Guarda los antecedentes patológicos (texto libre; vacío = sin registrar). */
export const savePathological = (patientId: string, data: PathologicalHistory) =>
  call(() => putJson<PatientHistory>(`/api/patients/${patientId}/history/patologicos`, data));
