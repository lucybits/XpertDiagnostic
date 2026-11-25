import { getJson } from '@/lib/apiClient';
import type { PatientResult } from '@/types/result';
import type { RecordResult } from './recordService';

const MESSAGES: Record<number, string> = {
  401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  404: 'No se encontró al paciente.',
  403: 'Tu cuenta no tiene permiso para esta acción.',
};

function fail<T>(status: number): RecordResult<T> {
  return { ok: false, message: MESSAGES[status] ?? 'No se pudo completar. Inténtalo de nuevo en un momento.' };
}

function offline<T>(): RecordResult<T> {
  return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
}

/** Entradas y salidas del paciente para la interfaz de salida (P-105). @post Nunca lanza. */
export async function getResult(patientId: string): Promise<RecordResult<PatientResult>> {
  try {
    const response = await getJson<PatientResult>(`/api/patients/${patientId}/result`);
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}
