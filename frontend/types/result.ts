import type { PatientRecord } from './record';

/** Interfaz de salida del expediente (P-105), tal como la devuelve el backend. */

/** Tratamiento de la enfermedad diagnosticada. @inv dosisMinima <= dosisMaxima cuando ambas existen. */
export interface TreatmentView {
  idTratamiento: string;
  descripcion: string;
  dosisMinima: number | null;
  dosisMaxima: number | null;
  unidades: string | null;
}

/** Plan, pronóstico (expectativa) y seguimiento. */
export interface CarePlanView {
  idPlan: string;
  planIndicado: string;
  pronostico: string | null;
  seguimiento: string | null;
}

/**
 * Entradas capturadas y salidas guardadas del paciente.
 * @inv tratamientos son los de la enfermedad diagnosticada (vacío sin diagnóstico).
 * @inv idTratamiento, si existe, es uno de tratamientos.
 */
export interface PatientResult {
  paciente: { idPaciente: string; nombreCompleto: string; edad: number; diagnostico: string | null };
  expediente: PatientRecord;
  idEnfermedadDiagnosticada: string | null;
  enfermedadDiagnosticada: string | null;
  tratamientos: TreatmentView[];
  idTratamiento: string | null;
  plan: CarePlanView | null;
}

/** Plan que escribe el médico (decisión de Lucía, P-105); mismos límites que la tabla PLANES. */
export interface CarePlanInput {
  planIndicado: string;
  pronostico: string;
  seguimiento: string;
}

export const CARE_PLAN_LIMITS = { planMin: 3, planMax: 1000, pronosticoMax: 300, seguimientoMax: 300 } as const;
