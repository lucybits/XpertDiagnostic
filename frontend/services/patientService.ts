import { getJson, postJson } from '@/lib/apiClient';
import type { NewPatient, Patient } from '@/types/patient';

/** Paciente tal como lo devuelve el backend (PatientSummary). */
interface BackendPatient {
  idPaciente: string;
  nombreCompleto: string;
  /** AAAA-MM-DD. */
  fechaNacimiento: string;
  /** Calculada por el servidor a partir de la fecha de nacimiento. */
  edad: number;
  diagnostico: string | null;
}

/** Convierte el paciente del backend al modelo del buscador. */
function toPatient(data: BackendPatient): Patient {
  return {
    id: data.idPaciente,
    recordNumber: data.idPaciente,
    fullName: data.nombreCompleto,
    birthDate: data.fechaNacimiento,
    age: data.edad,
    diagnosis: data.diagnostico,
  };
}

export type PatientListResult = { ok: true; patients: Patient[] } | { ok: false; reason: 'unauthenticated' | 'unavailable' };

/**
 * Pacientes registrados en la base de datos (ESP-004).
 * @post Nunca lanza: la lista, o el motivo si no hay sesión o falló el servidor o la red.
 */
export async function listPatients(): Promise<PatientListResult> {
  try {
    const response = await getJson<BackendPatient[]>('/api/patients');
    if (response.ok && Array.isArray(response.data)) return { ok: true, patients: response.data.map(toPatient) };
    return { ok: false, reason: response.status === 401 ? 'unauthenticated' : 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export type RegisterPatientResult = { ok: true; patient: Patient } | { ok: false; message: string };

/**
 * Registra un paciente en PACIENTES; el servidor asigna el IdPaciente (ESP-004, RF-32).
 * Solo lo puede hacer el administrador (P-144).
 * @pre data ya pasó validateNewPatient.
 * @post Nunca lanza: el paciente creado, o un mensaje listo para mostrar al médico.
 */
export async function registerPatient(data: NewPatient): Promise<RegisterPatientResult> {
  try {
    const response = await postJson<BackendPatient>('/api/patients', data);
    if (response.ok && response.data) return { ok: true, patient: toPatient(response.data) };
    switch (response.status) {
      case 401:
        return { ok: false, message: 'Tu sesión terminó. Vuelve a iniciar sesión para registrar al paciente.' };
      case 400:
        return { ok: false, message: 'Revisa el nombre, los apellidos, la fecha de nacimiento y el sexo e inténtalo de nuevo.' };
      case 403:
        return { ok: false, message: 'Solo un administrador puede registrar pacientes.' };
      default:
        return { ok: false, message: 'No se pudo registrar al paciente. Inténtalo de nuevo en un momento.' };
    }
  } catch {
    return { ok: false, message: 'Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo.' };
  }
}
