import type { ValidationState } from './validation';

/** Modelo de paciente registrado, tal como lo muestra el buscador (tabla PACIENTES). */

/**
 * @inv recordNumber es único por paciente (IdPaciente, p. ej. "PACIE00001").
 * @inv age >= 0.
 * @inv diagnosis es el nombre de la enfermedad diagnosticada (la confirma el médico internista), o null.
 */
export interface Patient {
  id: string;
  recordNumber: string;
  fullName: string;
  /** Fecha de nacimiento en formato AAAA-MM-DD (P-144). */
  birthDate: string;
  /** Años cumplidos; el servidor la calcula de la fecha de nacimiento. */
  age: number;
  diagnosis: string | null;
  /** Validación del diagnóstico (P-151): 'P' en validación, 'C' confirmado, null sin enviar. */
  validationState: ValidationState | null;
  /** Médico internista que confirmó el diagnóstico, o null. */
  validatedBy: string | null;
}

export type AgeFilter = 'all' | '0-17' | '18-39' | '40-64' | '65+';

/** 'all' = cualquier diagnóstico; 'none' = sin diagnóstico; otro valor = nombre exacto de la enfermedad. */
export type DiagnosisFilter = string;

export interface PatientSearchCriteria {
  query: string;
  age: AgeFilter;
  diagnosis: DiagnosisFilter;
}

export const EMPTY_PATIENT_SEARCH: PatientSearchCriteria = {
  query: '',
  age: 'all',
  diagnosis: 'all',
};

export const DIAGNOSIS_ALL = 'all';
export const DIAGNOSIS_NONE = 'none';

/**
 * Límites del alta de paciente, iguales a CreatePatientRequest y a la tabla PACIENTES (ESP-004, P-144):
 * Nombres NVARCHAR(60), ApellidoPaterno y ApellidoMaterno NVARCHAR(40), y una fecha de nacimiento que
 * da una edad de 0 a 130 años.
 */
export const PATIENT_LIMITS = {
  partMin: 2,
  givenNamesMax: 60,
  surnameMax: 40,
  ageMax: 130,
} as const;

/** Sexo del paciente (PACIENTES.Sexo: CHAR(1) obligatorio, 'F' o 'M' en mayúscula). */
export const SEX_OPTIONS = [
  { value: 'F', label: 'Mujer' },
  { value: 'M', label: 'Hombre' },
] as const;

export type Sex = (typeof SEX_OPTIONS)[number]['value'];

export function isSex(value: string): value is Sex {
  return SEX_OPTIONS.some((option) => option.value === value);
}

/**
 * Preguntas sí/no de antecedentes no patológicos. Las responde el médico tratante en la captura
 * (parte del interrogatorio, P-145); el administrador ya no las pregunta en el alta (P-144).
 * Cada key va a una columna de IO_AntecNoPatolPacientes.
 */
export const NON_PATHOLOGICAL_QUESTIONS = [
  { key: 'tabaquismo', label: '¿Fuma?' },
  { key: 'alcoholismo', label: '¿Consume alcohol?' },
  { key: 'toxicomanias', label: '¿Consume drogas?' },
  { key: 'biomasa', label: '¿Exposición a humo de leña o biomasa?' },
  { key: 'tatuajesPerforaciones', label: '¿Tiene tatuajes o perforaciones?' },
  { key: 'herbolaria', label: '¿Usa herbolaria o remedios naturales?' },
  { key: 'transfusiones', label: '¿Ha recibido transfusiones?' },
] as const;

export type NonPathologicalKey = (typeof NON_PATHOLOGICAL_QUESTIONS)[number]['key'];

/** Respuestas sí (true) / no (false) a NON_PATHOLOGICAL_QUESTIONS. */
export type NonPathologicalHistory = Record<NonPathologicalKey, boolean>;

/** Todas las respuestas en "no": así empieza el formulario. */
export const EMPTY_NON_PATHOLOGICAL_HISTORY: NonPathologicalHistory = {
  tabaquismo: false,
  alcoholismo: false,
  toxicomanias: false,
  biomasa: false,
  tatuajesPerforaciones: false,
  herbolaria: false,
  transfusiones: false,
};

/** Datos del alta de un paciente ya validados. */
export interface NewPatient {
  givenNames: string;
  paternalSurname: string;
  /** null si el paciente no tiene segundo apellido. */
  maternalSurname: string | null;
  /** AAAA-MM-DD. */
  birthDate: string;
  sex: Sex;
}

export type NewPatientField = keyof NewPatient;
