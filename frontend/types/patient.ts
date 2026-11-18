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
 * Límites del alta de paciente, iguales a la tabla PACIENTES (ESP-004):
 * NombreCompleto NVARCHAR(150) NOT NULL y Edad INT con CHECK (Edad BETWEEN 0 AND 130).
 */
export const PATIENT_LIMITS = {
  nameMin: 3,
  nameMax: 150,
  ageMin: 0,
  ageMax: 130,
} as const;

/** Datos del alta de un paciente ya validados. */
export interface NewPatient {
  fullName: string;
  age: number;
}

export type NewPatientField = keyof NewPatient;
