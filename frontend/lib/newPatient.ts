import {
  EMPTY_NON_PATHOLOGICAL_HISTORY,
  NON_PATHOLOGICAL_QUESTIONS,
  PATIENT_LIMITS,
  isSex,
  type NewPatient,
  type NewPatientField,
  type NonPathologicalHistory,
} from '@/types/patient';

/** Datos del formulario tal como se escriben (texto), antes de convertirlos. */
export interface NewPatientInput {
  fullName: string;
  /** Fecha de nacimiento como la da <input type="date">: "AAAA-MM-DD" (vacía si no se eligió). */
  birthDate: string;
  /** "F" o "M"; vacío si no se eligió. */
  sex: string;
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

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Un nombre lleva letras (de cualquier idioma, con acentos) y no lleva números (P-99: "111" no es un nombre).
const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT = /\d/;

/** Fecha local de hoy como "AAAA-MM-DD" (el formato de <input type="date">). */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Edad en años cumplidos a partir de la fecha de nacimiento (igual que EdadPaciente.Calcular en el backend).
 *
 * @pre birthDate y today tienen formato "AAAA-MM-DD".
 * @post null si birthDate no es una fecha real (p. ej. "2024-02-30"); negativa si es posterior a today.
 */
export function ageFromBirthDate(birthDate: string, today: string): number | null {
  const born = ISO_DATE_PATTERN.exec(birthDate);
  const now = ISO_DATE_PATTERN.exec(today);
  if (!born || !now) return null;
  const [by, bm, bd] = born.slice(1).map(Number);
  const [ty, tm, td] = now.slice(1).map(Number);
  const check = new Date(Date.UTC(by, bm - 1, bd));
  if (check.getUTCFullYear() !== by || check.getUTCMonth() !== bm - 1 || check.getUTCDate() !== bd) return null;
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  return ty - by - (hadBirthday ? 0 : 1);
}

/**
 * Valida el alta de un paciente con las reglas de la tabla PACIENTES (ESP-004).
 *
 * @pre input.fullName, input.birthDate e input.sex son cadenas (pueden estar vacías).
 * @pre today tiene formato "AAAA-MM-DD" (por omisión, la fecha local de hoy).
 * @post ok == true  → data.fullName sin espacios en los extremos ni dobles, de nameMin a nameMax
 *   caracteres, con al menos una letra y sin números; data.birthDate es una fecha real que da una
 *   edad entre ageMin y ageMax; data.sex es "F" o "M"; data.history con una respuesta sí/no por pregunta.
 * @post ok == false → errors tiene un mensaje por cada campo inválido.
 */
export function validateNewPatient(
  input: NewPatientInput,
  today: string = toIsoDate(new Date()),
): { ok: true; data: NewPatient } | { ok: false; errors: NewPatientFieldErrors } {
  const errors: NewPatientFieldErrors = {};
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  const birthDate = input.birthDate.trim();
  const age = ageFromBirthDate(birthDate, today);
  // "f"/"m" se aceptan y se guardan en mayúscula.
  const sex = input.sex.trim().toUpperCase();

  if (fullName.length < PATIENT_LIMITS.nameMin || fullName.length > PATIENT_LIMITS.nameMax) {
    errors.fullName = `Escribe el nombre completo del paciente (${PATIENT_LIMITS.nameMin} a ${PATIENT_LIMITS.nameMax} caracteres).`;
  } else if (!HAS_LETTER.test(fullName) || HAS_DIGIT.test(fullName)) {
    errors.fullName = 'El nombre solo puede llevar letras, espacios y signos como guion o apóstrofo; sin números.';
  }
  if (age === null) {
    errors.birthDate = 'Elige la fecha de nacimiento del paciente.';
  } else if (age < PATIENT_LIMITS.ageMin) {
    errors.birthDate = 'La fecha de nacimiento no puede ser posterior a hoy.';
  } else if (age > PATIENT_LIMITS.ageMax) {
    errors.birthDate = `La fecha de nacimiento da más de ${PATIENT_LIMITS.ageMax} años; revísala.`;
  }
  if (!isSex(sex)) {
    errors.sex = 'Elige el sexo del paciente.';
  }

  if (Object.keys(errors).length > 0 || !isSex(sex)) return { ok: false, errors };
  return { ok: true, data: { fullName, birthDate, sex, history: toNonPathologicalHistory(input.history) } };
}
