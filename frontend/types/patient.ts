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
 * La edad ya no se escribe: se calcula de la fecha de nacimiento y debe quedar entre ageMin y ageMax.
 */
export const PATIENT_LIMITS = {
  nameMin: 15,
  nameMax: 150,
  ageMin: 0,
  ageMax: 100,
} as const;

/** Sexo del paciente (PACIENTES.Sexo, CHAR(1) con CHECK 'F'/'M'). */
export const SEX_OPTIONS = [
  { value: 'F', label: 'Mujer' },
  { value: 'M', label: 'Hombre' },
] as const;

export type Sex = (typeof SEX_OPTIONS)[number]['value'];

export function isSex(value: string): value is Sex {
  return SEX_OPTIONS.some((option) => option.value === value);
}

/**
 * Preguntas sí/no de antecedentes no patológicos que se hacen al registrar al paciente.
 * Cada key es el nombre que espera el backend (CreatePatientRequest) y va a una columna de
 * IO_AntecNoPatolPacientes.
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
  fullName: string;
  /** Fecha de nacimiento "AAAA-MM-DD"; el backend calcula y guarda la edad a partir de ella. */
  birthDate: string;
  sex: Sex;
  history: NonPathologicalHistory;
}

/** Campos del alta que pueden tener error (las casillas no fallan). */
export type NewPatientField = 'fullName' | 'birthDate' | 'sex';
