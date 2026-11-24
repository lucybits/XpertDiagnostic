import {
  Activity,
  ClipboardPlus,
  FlaskConical,
  Stethoscope,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';
import type { CatalogName } from '@/types/catalog';
import type { FindingSection, FindingType, PatientRecord } from '@/types/record';

/** Avance de captura de una sección del expediente. */
export type SectionStatus = 'pending' | 'in-progress' | 'complete';

/**
 * Qué captura una sección y dónde se guarda (P-103):
 * - findings: elementos de un catálogo → HALLAZGOS_PACIENTE con su TipoHallazgo.
 * - analysis: no captura; ejecuta la máquina de inferencia con lo capturado.
 */
export type SectionCapture =
  | { kind: 'findings'; section: FindingSection; catalog: CatalogName; findingType: FindingType; noun: string }
  | { kind: 'analysis' };

export interface ClinicalSection {
  id: string;
  label: string;
  icon: LucideIcon;
  status: SectionStatus;
  capture: SectionCapture;
}

export interface ClinicalSectionGroup {
  id: string;
  label: string;
  sections: readonly ClinicalSection[];
}

/**
 * Una sección pendiente está bloqueada: la captura avanza sección por sección,
 * así que solo se puede abrir la sección en proceso o una ya completada.
 */
export function isSectionLocked(section: ClinicalSection): boolean {
  return section.status === 'pending';
}

type SectionDefinition = Omit<ClinicalSection, 'status'>;

/**
 * Secciones alineadas con las entradas de la máquina de inferencia (decisión de Lucía, P-103), en el
 * orden en que se capturan: signos (exploración física), síntomas, resultados de estudios y
 * laboratorios, comorbilidades y, al final, el análisis. El orden del arreglo es el de captura:
 * buildSectionGroups desbloquea la primera sección sin completar y bloquea las siguientes.
 * Pendiente (tarea 2.2): "Antecedentes del paciente" irá antes de todas.
 */
const SECTION_DEFINITIONS: readonly { id: string; label: string; sections: readonly SectionDefinition[] }[] = [
  {
    id: 'evaluation',
    label: 'Evaluación clínica',
    sections: [
      {
        id: 'signs',
        label: 'Signos',
        icon: Activity,
        capture: { kind: 'findings', section: 'signos', catalog: 'signos', findingType: 'Signo', noun: 'signos' },
      },
      {
        id: 'symptoms',
        label: 'Síntomas',
        icon: Thermometer,
        capture: { kind: 'findings', section: 'sintomas', catalog: 'sintomas', findingType: 'Sintoma', noun: 'síntomas' },
      },
      {
        id: 'lab-studies',
        label: 'Resultados de estudios y laboratorios',
        icon: FlaskConical,
        capture: {
          kind: 'findings',
          section: 'estudios-laboratorio',
          catalog: 'estudios-laboratorio',
          findingType: 'Estudio_lab',
          noun: 'estudios',
        },
      },
      {
        id: 'comorbidities',
        label: 'Comorbilidades',
        icon: ClipboardPlus,
        capture: {
          kind: 'findings',
          section: 'comorbilidades',
          catalog: 'comorbilidades',
          findingType: 'Comorbilidad',
          noun: 'comorbilidades',
        },
      },
    ],
  },
  {
    id: 'result',
    label: 'Resultado',
    sections: [{ id: 'diagnosis', label: 'Diagnóstico diferencial', icon: Stethoscope, capture: { kind: 'analysis' } }],
  },
];

/**
 * Estados de las secciones a partir de las ya completadas.
 * @post Las completadas quedan "complete"; la primera sin completar queda "in-progress";
 *       las demás sin completar quedan "pending" (bloqueadas).
 */
export function buildSectionGroups(completed: ReadonlySet<string>): readonly ClinicalSectionGroup[] {
  let current: string | null = null;
  for (const group of SECTION_DEFINITIONS) {
    for (const section of group.sections) {
      if (current === null && !completed.has(section.id)) current = section.id;
    }
  }
  return SECTION_DEFINITIONS.map((group) => ({
    ...group,
    sections: group.sections.map((section) => ({
      ...section,
      status: completed.has(section.id) ? 'complete' : section.id === current ? 'in-progress' : 'pending',
    })),
  }));
}

/**
 * Secciones que ya tienen datos guardados en el expediente (para retomar a un paciente).
 * @post Incluye cada sección de hallazgos con al menos un hallazgo de su tipo. El análisis nunca se da por hecho.
 */
export function sectionsWithData(record: PatientRecord): Set<string> {
  const done = new Set<string>();
  for (const group of SECTION_DEFINITIONS) {
    for (const section of group.sections) {
      const { capture } = section;
      if (capture.kind === 'findings' && record.hallazgos.some((h) => h.tipoHallazgo === capture.findingType)) {
        done.add(section.id);
      }
    }
  }
  return done;
}

/** Estado inicial, sin nada capturado: la primera sección en proceso y las demás bloqueadas. */
export const CLINICAL_SECTION_GROUPS: readonly ClinicalSectionGroup[] = buildSectionGroups(new Set());
