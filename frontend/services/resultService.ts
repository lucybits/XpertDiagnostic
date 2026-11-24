import { getJson } from '@/lib/apiClient';
import type { PatientRecord } from '@/types/record';
import type { CarePlanInput, PatientResult } from '@/types/result';
import type { RecordResult } from './recordService';

const MESSAGES: Record<number, string> = {
  400: 'El dato no es válido. Revísalo e inténtalo de nuevo.',
  401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  404: 'No se encontró al paciente.',
  409: 'Primero confirma el diagnóstico.',
};

/** El 409 de "pendiente de validación" (P-145) trae su propio texto; se usa el del servidor si viene. */
function fail<T>(status: number, serverMessage?: unknown): RecordResult<T> {
  if (status === 409 && typeof serverMessage === 'string' && serverMessage) return { ok: false, message: serverMessage };
  return { ok: false, message: MESSAGES[status] ?? 'No se pudo completar. Inténtalo de nuevo en un momento.' };
}

/** Mensaje de error del backend ({ error }), si lo hay. */
const errorText = (data: unknown) => (data as { error?: unknown } | null)?.error;

function offline<T>(): RecordResult<T> {
  return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
}

async function put<T = PatientResult>(url: string, body: unknown): Promise<RecordResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as T | null;
    return response.ok && data ? { ok: true, data } : fail(response.status, errorText(data));
  } catch {
    return offline();
  }
}

/** Entradas y salidas del paciente para la interfaz de salida (P-105). @post Nunca lanza. */
export async function getResult(patientId: string): Promise<RecordResult<PatientResult>> {
  try {
    const response = await getJson<PatientResult>(`/api/patients/${patientId}/result`);
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status, errorText(response.data));
  } catch {
    return offline();
  }
}

/**
 * Confirma la enfermedad diagnosticada (la elige el tratante del análisis) y la envía a validación del
 * internista (P-145). Devuelve el expediente con EstadoValidacion = "Pendiente". @post Nunca lanza.
 */
export const confirmDiagnosis = (patientId: string, diseaseId: string) =>
  put<PatientRecord>(`/api/patients/${patientId}/diagnosis`, { idEnfermedad: diseaseId });

/** Guarda el tratamiento indicado, uno de los de la enfermedad diagnosticada. @post Nunca lanza. */
export const chooseTreatment = (patientId: string, treatmentId: string) =>
  put(`/api/patients/${patientId}/treatment`, { idTratamiento: treatmentId });

/** Guarda el plan, pronóstico y seguimiento escritos por el médico. @post Nunca lanza. */
export const saveCarePlan = (patientId: string, plan: CarePlanInput) =>
  put(`/api/patients/${patientId}/plan`, {
    planIndicado: plan.planIndicado,
    pronostico: plan.pronostico.trim() === '' ? null : plan.pronostico,
    seguimiento: plan.seguimiento.trim() === '' ? null : plan.seguimiento,
  });
