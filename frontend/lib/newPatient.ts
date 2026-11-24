import {
  EMPTY_NON_PATHOLOGICAL_HISTORY,
  NON_PATHOLOGICAL_QUESTIONS,
  PATIENT_LIMITS,
  type NewPatient,
  type NewPatientField,
  type NonPathologicalHistory,
} from '@/types/patient';

/** Datos del formulario tal como se escriben (texto), antes de convertirlos. */
export interface NewPatientInput {
  fullName: string;
  age: string;
  /** Casillas de antecedentes no patológicos; si falta o una respuesta no es true, cuenta como "no". */
  history?: unknown;
}

/** Respuestas sí/no a partir de un valor cualquiera: solo true cuenta como "sí". */
export function toNonPathologicalHistory(value: unknown): NonPathologicalHistory {
  const answers = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const history = { ...EMPTY_NON_PATHOLOGICAL_HISTORY };
  for (const { key } of NON_PATHOLOGICAL_QUESTIONS) history[key] = answers[key] === true;
  return history;
}

export type NewPatientFieldErrors = Partial<Record<NewPatientField, string>>;

const DIGITS_PATTERN = /^\d+$/;
// Un nombre lleva letras (de cualquier idioma, con acentos) y no lleva números (P-99: "111" no es un nombre).
const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT = /\d/;

/**
 * Valida el alta de un paciente con las reglas de la tabla PACIENTES (ESP-004).
 *
 * @pre input.fullName e input.age son cadenas (pueden estar vacías).
 * @post ok == true  → data.fullName sin espacios en los extremos ni dobles, de nameMin a nameMax
 *   caracteres, con al menos una letra y sin números; data.age entero entre ageMin y ageMax;
 *   data.history con una respuesta sí/no por pregunta.
 * @post ok == false → errors tiene un mensaje por cada campo inválido.
 */
export function validateNewPatient(
  input: NewPatientInput,
): { ok: true; data: NewPatient } | { ok: false; errors: NewPatientFieldErrors } {
  const errors: NewPatientFieldErrors = {};
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const ageText = input.age.trim();
  const age = DIGITS_PATTERN.test(ageText) ? Number(ageText) : Number.NaN;

  if (fullName.length < PATIENT_LIMITS.nameMin || fullName.length > PATIENT_LIMITS.nameMax) {
    errors.fullName = `Escribe el nombre completo del paciente (${PATIENT_LIMITS.nameMin} a ${PATIENT_LIMITS.nameMax} caracteres).`;
  } else if (!HAS_LETTER.test(fullName) || HAS_DIGIT.test(fullName)) {
    errors.fullName = 'El nombre solo puede llevar letras, espacios y signos como guion o apóstrofo; sin números.';
  }
  if (!Number.isSafeInteger(age) || age < PATIENT_LIMITS.ageMin || age > PATIENT_LIMITS.ageMax) {
    errors.age = `Escribe la edad en años, un número entero de ${PATIENT_LIMITS.ageMin} a ${PATIENT_LIMITS.ageMax}.`;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data: { fullName, age, history: toNonPathologicalHistory(input.history) } };
}
