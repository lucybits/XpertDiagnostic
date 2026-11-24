/** Modelo de paciente registrado, tal como lo muestra el buscador (tabla PACIENTES). */

/**
 * @inv recordNumber es único por paciente (IdPaciente, p. ej. "PACIE00001").
 * @inv age >= 0.
 * @inv diagnosis es el nombre de la enfermedad diagnosticada, o null si aún no tiene.
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

/** Datos del alta de un paciente ya validados. */
export interface NewPatient {
  givenNames: string;
  paternalSurname: string;
  /** null si el paciente no tiene segundo apellido. */
  maternalSurname: string | null;
  /** AAAA-MM-DD. */
  birthDate: string;
}

export type NewPatientField = keyof NewPatient;
