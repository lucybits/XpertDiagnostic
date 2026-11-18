import {
  DIAGNOSIS_ALL,
  DIAGNOSIS_NONE,
  type AgeFilter,
  type Patient,
  type PatientSearchCriteria,
} from '@/types/patient';

const AGE_RANGES: Record<Exclude<AgeFilter, 'all'>, [number, number]> = {
  '0-17': [0, 17],
  '18-39': [18, 39],
  '40-64': [40, 64],
  '65+': [65, Number.POSITIVE_INFINITY],
};

/** Quita acentos y mayúsculas para comparar sin importar cómo se escribió. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/**
 * Filtra pacientes por texto (nombre o número de expediente), rango de edad y diagnóstico.
 *
 * @post Devuelve solo pacientes que cumplen todos los criterios, en el mismo orden de entrada.
 * @post Con criterios vacíos, devuelve todos los pacientes.
 * @post No modifica el arreglo recibido.
 */
export function filterPatients(patients: readonly Patient[], criteria: PatientSearchCriteria): Patient[] {
  const query = normalize(criteria.query);

  return patients.filter((patient) => {
    if (query) {
      const matchesText =
        normalize(patient.fullName).includes(query) || normalize(patient.recordNumber).includes(query);
      if (!matchesText) return false;
    }

    if (criteria.age !== 'all') {
      const [min, max] = AGE_RANGES[criteria.age];
      if (patient.age < min || patient.age > max) return false;
    }

    if (criteria.diagnosis === DIAGNOSIS_NONE) {
      if (patient.diagnosis !== null) return false;
    } else if (criteria.diagnosis !== DIAGNOSIS_ALL && patient.diagnosis !== criteria.diagnosis) {
      return false;
    }

    return true;
  });
}

/**
 * Diagnósticos presentes en la lista, sin repetir y en orden alfabético, para el filtro.
 * @post No incluye null; hasPatientsWithoutDiagnosis indica si hace falta la opción "Sin diagnóstico".
 */
export function getDiagnosisOptions(patients: readonly Patient[]): {
  diagnoses: string[];
  hasPatientsWithoutDiagnosis: boolean;
} {
  const diagnoses = new Set<string>();
  let hasPatientsWithoutDiagnosis = false;

  for (const patient of patients) {
    if (patient.diagnosis === null) hasPatientsWithoutDiagnosis = true;
    else diagnoses.add(patient.diagnosis);
  }

  return { diagnoses: [...diagnoses].sort((a, b) => a.localeCompare(b, 'es')), hasPatientsWithoutDiagnosis };
}

/** Indica si hay algún criterio aplicado. */
export function hasActiveCriteria(criteria: PatientSearchCriteria): boolean {
  return criteria.query.trim() !== '' || criteria.age !== 'all' || criteria.diagnosis !== DIAGNOSIS_ALL;
}
