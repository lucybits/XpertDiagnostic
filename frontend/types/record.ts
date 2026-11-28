/** Expediente capturado y análisis (P-103), tal como los devuelve el backend. */

import type { NonPathologicalHistory } from './patient';

/** Tipos de HALLAZGOS_PACIENTE. */
export type FindingType = 'Sintoma' | 'Signo' | 'Estudio_lab' | 'Estudio_diagdif' | 'Comorbilidad' | 'Complicacion';

/** Grupos de hallazgos en el orden de la historia clínica (interfaz de salida y pantalla del internista). */
export const FINDING_GROUPS: readonly { type: FindingType; label: string }[] = [
  { type: 'Comorbilidad', label: 'Comorbilidades' },
  { type: 'Sintoma', label: 'Síntomas' },
  { type: 'Signo', label: 'Signos' },
  { type: 'Estudio_lab', label: 'Estudios de laboratorio' },
  { type: 'Estudio_diagdif', label: 'Estudios de diagnóstico diferencial' },
  { type: 'Complicacion', label: 'Complicaciones' },
];

/** Secciones que guardan hallazgos: nombre en la URL /api/patients/{id}/findings/{section}. */
export const FINDING_SECTIONS = ['sintomas', 'signos', 'estudios-laboratorio', 'comorbilidades'] as const;
export type FindingSection = (typeof FINDING_SECTIONS)[number];

/** Un hallazgo con la descripción de su catálogo. @inv valor es "presente" o una medición. */
export interface FindingView {
  tipoHallazgo: FindingType;
  idRegistro: string;
  descripcion: string;
  valor: string;
  unidades: string | null;
}

/**
 * Validación del diagnóstico por el internista (P-145): null = en captura; 'Pendiente' = el tratante
 * confirmó y lo envió; 'Validado' = el tratante ya puede ver la interfaz de salida.
 */
export type ValidationStatus = 'Pendiente' | 'Validado' | null;

/** Expediente del paciente: entradas de la máquina de inferencia y lo que captura el tratante (P-145). */
export interface PatientRecord {
  idPaciente: string;
  hallazgos: FindingView[];
  /** null si el tratante todavía no hace el interrogatorio. */
  antecedentesNoPatologicos: NonPathologicalHistory | null;
  hipotesisInicial: string | null;
  estadoValidacion: ValidationStatus;
}

/** Un hallazgo elegido al capturar. @inv valor null = "presente"; si viene, es un número. */
export interface FindingInput {
  idRegistro: string;
  valor: string | null;
}

/** Candidato del diagnóstico diferencial. @inv 0 < puntaje <= 1. */
export interface DiagnosisCandidate {
  idEnfermedad: string;
  nombre: string;
  coincidencias: number;
  totalCriterios: number;
  puntaje: number;
  apoyos: string[];
  /** Primer tratamiento de la enfermedad en la base de conocimiento, o null (P-160). */
  tratamientoSugerido?: string | null;
}

/** Resultado del análisis de la máquina de inferencia (P-160). */
export interface DiagnosisResult {
  motor: string;
  candidatos: DiagnosisCandidate[];
}
