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

/**
 * Plan, pronóstico (expectativa) y seguimiento (P-164). planIndicado lista los tratamientos de la base de
 * conocimiento; pronóstico y seguimiento vienen del plan guardado del paciente, si tiene.
 */
export interface CarePlanView {
  idPlan: string | null;
  planIndicado: string;
  pronostico: string | null;
  seguimiento: string | null;
}

/**
 * Entradas capturadas y salidas del paciente. Solo lectura (P-164).
 * @inv Sin confirmación del médico internista no hay diagnóstico, tratamientos ni plan.
 * @inv tratamientos son los de la enfermedad confirmada; idTratamiento es el primero (inference_engine.prg).
 */
export interface PatientResult {
  paciente: {
    idPaciente: string;
    nombreCompleto: string;
    edad: number;
    diagnostico: string | null;
    /** Validación del médico internista (P-151): 'P', 'C' o null. */
    estadoValidacion: string | null;
    /** Internista que confirmó el diagnóstico, o null. */
    validadoPor: string | null;
  };
  expediente: PatientRecord;
  idEnfermedadDiagnosticada: string | null;
  enfermedadDiagnosticada: string | null;
  tratamientos: TreatmentView[];
  idTratamiento: string | null;
  plan: CarePlanView | null;
  /** Cuándo confirmó el médico internista (ISO), o null. */
  fechaValidacion: string | null;
}
