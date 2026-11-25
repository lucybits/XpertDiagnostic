import type { NonPathologicalHistory } from './patient';

/** Interrogatorio del paciente (P-159): antecedentes no patológicos y patológicos. */

/**
 * Campos de antecedentes patológicos (IO_AntecPatolPacientes), en el orden en que se preguntan. La key es
 * el nombre de la columna en camelCase, como la devuelve el backend.
 */
export const PATHOLOGICAL_FIELDS = [
  { key: 'alergias', label: 'Alergias' },
  { key: 'croniDegen', label: 'Crónico-degenerativos' },
  { key: 'endocrinol', label: 'Endocrinológicos' },
  { key: 'cardiologic', label: 'Cardiológicos' },
  { key: 'dislipidem', label: 'Dislipidemias' },
  { key: 'pulmonar', label: 'Pulmonares' },
  { key: 'neumologic', label: 'Neumológicos' },
  { key: 'gastrointe', label: 'Gastrointestinales' },
  { key: 'uroloRenal', label: 'Urológicos y renales' },
  { key: 'neurologic', label: 'Neurológicos' },
  { key: 'psiquiatri', label: 'Psiquiátricos' },
  { key: 'reumatolog', label: 'Reumatológicos' },
  { key: 'osteomuscu', label: 'Osteomusculares' },
  { key: 'dermatolog', label: 'Dermatológicos' },
  { key: 'oftalmolog', label: 'Oftalmológicos' },
  { key: 'otorrinola', label: 'Otorrinolaringológicos' },
  { key: 'infectolog', label: 'Infectológicos' },
  { key: 'hematologi', label: 'Hematológicos' },
  { key: 'oncologico', label: 'Oncológicos' },
  { key: 'ginecologi', label: 'Ginecológicos' },
  { key: 'traumatism', label: 'Traumatismos' },
] as const;

export type PathologicalKey = (typeof PATHOLOGICAL_FIELDS)[number]['key'];

/** Antecedentes patológicos: texto libre por campo; null = sin registrar. @inv cada texto ≤ 255 caracteres. */
export type PathologicalHistory = Record<PathologicalKey, string | null>;

/** Límite de cada texto (columna NVARCHAR(255)). */
export const PATHOLOGICAL_MAX_LENGTH = 255;

/** Interrogatorio guardado. @inv cada parte es null mientras no se haya guardado. */
export interface PatientHistory {
  idPaciente: string;
  noPatologicos: NonPathologicalHistory | null;
  patologicos: PathologicalHistory | null;
}

export const isPathologicalKey = (value: string): value is PathologicalKey =>
  PATHOLOGICAL_FIELDS.some((field) => field.key === value);
