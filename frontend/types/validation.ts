import type { DiagnosisResult, PatientRecord } from './record';

/**
 * Validación del diagnóstico por el médico internista (P-151), tal como la devuelve el backend.
 * Flujo: el tratante analiza y envía el diagnóstico diferencial; el internista confirma un candidato.
 */

/** Valores de PACIENTES.EstadoValidacion: P pendiente, C confirmado (null: aún no se envía). */
export const VALIDATION_STATES = { pending: 'P', confirmed: 'C' } as const;
export type ValidationState = (typeof VALIDATION_STATES)[keyof typeof VALIDATION_STATES];

export const isValidationState = (value: unknown): value is ValidationState =>
  value === VALIDATION_STATES.pending || value === VALIDATION_STATES.confirmed;

/**
 * Estado de la validación de un paciente.
 * @inv estado === 'C' ⇒ diagnostico no es null.
 * @inv solicitante y validador son nombres de médico, o null si la cuenta ya no existe.
 * @inv fechaSolicitud y fechaValidacion son ISO 8601 en UTC.
 */
export interface ValidationSummary {
  idPaciente: string;
  nombreCompleto: string;
  edad: number;
  sexo: string;
  estado: ValidationState | null;
  solicitante: string | null;
  fechaSolicitud: string | null;
  validador: string | null;
  fechaValidacion: string | null;
  diagnostico: string | null;
}

/** Lo que revisa el internista: el paciente, sus hallazgos y el diagnóstico diferencial actual. */
export interface ValidationDetail {
  paciente: ValidationSummary;
  expediente: PatientRecord;
  analisis: DiagnosisResult;
}

/** Fecha y hora local para los avisos ("24 nov 2026, 11:30"). */
export function formatValidationDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
