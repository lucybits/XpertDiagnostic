import { getJson, postJson } from '@/lib/apiClient';
import type { NonPathologicalHistory } from '@/types/patient';
import type { DiagnosisResult, FindingInput, FindingSection, PatientRecord } from '@/types/record';

/** Resultado de las operaciones del expediente: el dato, o un mensaje listo para el médico. */
export type RecordResult<T> = { ok: true; data: T } | { ok: false; message: string };

const MESSAGES: Record<number, string> = {
  400: 'Algún dato no es válido. Revisa la selección e inténtalo de nuevo.',
  401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  403: 'Solo el médico tratante puede capturar el expediente.',
  404: 'No se encontró al paciente.',
};

function fail<T>(status: number): RecordResult<T> {
  return { ok: false, message: MESSAGES[status] ?? 'No se pudo completar. Inténtalo de nuevo en un momento.' };
}

function offline<T>(): RecordResult<T> {
  return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
}

async function putJson<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status, data: (await response.json().catch(() => null)) as T | null };
}

/** Expediente capturado del paciente. @post Nunca lanza. */
export async function getRecord(patientId: string): Promise<RecordResult<PatientRecord>> {
  try {
    const response = await getJson<PatientRecord>(`/api/patients/${patientId}/record`);
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}

/**
 * Guarda los hallazgos de una sección (reemplaza los anteriores de ese tipo).
 * @post Nunca lanza: el expediente actualizado o el motivo del error.
 */
export async function saveFindings(
  patientId: string,
  section: FindingSection,
  findings: FindingInput[],
): Promise<RecordResult<PatientRecord>> {
  try {
    const response = await putJson<PatientRecord>(`/api/patients/${patientId}/findings/${section}`, {
      hallazgos: findings,
    });
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}

/**
 * Guarda los antecedentes no patológicos del interrogatorio (P-145).
 * @post Nunca lanza: el expediente actualizado o el motivo del error.
 */
export async function saveNonPathologicalHistory(
  patientId: string,
  history: NonPathologicalHistory,
): Promise<RecordResult<PatientRecord>> {
  try {
    const response = await putJson<PatientRecord>(`/api/patients/${patientId}/non-pathological-history`, history);
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}

/**
 * Guarda la hipótesis diagnóstica inicial (P-145).
 * @pre hypothesis ya pasó validateHypothesis.
 * @post Nunca lanza: el expediente actualizado o el motivo del error.
 */
export async function saveHypothesis(patientId: string, hypothesis: string): Promise<RecordResult<PatientRecord>> {
  try {
    const response = await putJson<PatientRecord>(`/api/patients/${patientId}/hypothesis`, { hipotesis: hypothesis });
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}

/** Analiza los hallazgos guardados con la máquina de inferencia del backend. @post Nunca lanza. */
export async function analyzePatient(patientId: string): Promise<RecordResult<DiagnosisResult>> {
  try {
    const response = await postJson<DiagnosisResult>(`/api/patients/${patientId}/analysis`, {});
    return response.ok && response.data ? { ok: true, data: response.data } : fail(response.status);
  } catch {
    return offline();
  }
}
