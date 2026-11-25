import { PATIENT_LIMITS, isSex, type NewPatient, type NewPatientField } from '@/types/patient';

/** Datos del formulario tal como se escriben (texto), antes de convertirlos. */
export interface NewPatientInput {
  givenNames: string;
  paternalSurname: string;
  maternalSurname: string;
  /** Valor de <input type="date">: AAAA-MM-DD, o vacío. */
  birthDate: string;
  /** "F" o "M"; vacío si no se eligió. Se acepta en minúscula y se convierte a mayúscula. */
  sex: string;
}

export type NewPatientFieldErrors = Partial<Record<NewPatientField, string>>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Un nombre lleva letras (de cualquier idioma, con acentos) y no lleva números (P-99: "111" no es un nombre).
const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT = /\d/;

const clean = (text: string) => text.trim().replace(/\s+/g, ' ');

/** Fecha local de hoy en AAAA-MM-DD (la que usa <input type="date">). */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Fecha más antigua permitida: hoy hace PATIENT_LIMITS.ageMax años. */
export function oldestBirthDateIso(now: Date = new Date()): string {
  return todayIso(new Date(now.getFullYear() - PATIENT_LIMITS.ageMax, now.getMonth(), now.getDate()));
}

/** @post true si text es una fecha real del calendario en AAAA-MM-DD (rechaza 2026-02-30). */
function isRealDate(text: string): boolean {
  const match = DATE_PATTERN.exec(text);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function namePartError(value: string, label: string, max: number, required: boolean): string | undefined {
  if (!value) return required ? `Escribe ${label}.` : undefined;
  if (value.length < PATIENT_LIMITS.partMin || value.length > max) {
    return `Escribe ${label} (${PATIENT_LIMITS.partMin} a ${max} caracteres).`;
  }
  if (!HAS_LETTER.test(value) || HAS_DIGIT.test(value)) {
    return 'Solo puede llevar letras, espacios y signos como guion o apóstrofo; sin números.';
  }
  return undefined;
}

/**
 * Valida el alta de un paciente con las mismas reglas que el backend (CreatePatientRequest, P-144).
 *
 * @pre Todos los campos de input son cadenas (pueden estar vacías).
 * @post ok == true  → nombre(s) y apellido paterno limpios (sin espacios dobles ni en los extremos), con
 *   letras y sin números; apellido materno igual o null si se dejó vacío; birthDate es una fecha real,
 *   no futura y de hace como mucho ageMax años; sex es "F" o "M" (en mayúscula aunque se haya escrito en minúscula).
 * @post ok == false → errors tiene un mensaje por cada campo inválido.
 */
export function validateNewPatient(
  input: NewPatientInput,
  now: Date = new Date(),
): { ok: true; data: NewPatient } | { ok: false; errors: NewPatientFieldErrors } {
  const errors: NewPatientFieldErrors = {};
  const givenNames = clean(input.givenNames);
  const paternalSurname = clean(input.paternalSurname);
  const maternalSurname = clean(input.maternalSurname);
  const birthDate = input.birthDate.trim();
  const sex = input.sex.trim().toUpperCase();

  const givenError = namePartError(givenNames, 'el nombre o los nombres', PATIENT_LIMITS.givenNamesMax, true);
  if (givenError) errors.givenNames = givenError;
  const paternalError = namePartError(paternalSurname, 'el apellido paterno', PATIENT_LIMITS.surnameMax, true);
  if (paternalError) errors.paternalSurname = paternalError;
  const maternalError = namePartError(maternalSurname, 'el apellido materno', PATIENT_LIMITS.surnameMax, false);
  if (maternalError) errors.maternalSurname = maternalError;

  // Las fechas AAAA-MM-DD se comparan bien como texto.
  if (!birthDate) {
    errors.birthDate = 'Escribe la fecha de nacimiento.';
  } else if (!isRealDate(birthDate)) {
    errors.birthDate = 'Escribe una fecha válida (día, mes y año).';
  } else if (birthDate > todayIso(now)) {
    errors.birthDate = 'La fecha de nacimiento no puede ser futura.';
  } else if (birthDate < oldestBirthDateIso(now)) {
    errors.birthDate = `La edad no puede pasar de ${PATIENT_LIMITS.ageMax} años.`;
  }

  if (!isSex(sex)) errors.sex = 'Elige el sexo del paciente.';

  if (Object.keys(errors).length > 0 || !isSex(sex)) return { ok: false, errors };
  return {
    ok: true,
    data: { givenNames, paternalSurname, maternalSurname: maternalSurname || null, birthDate, sex },
  };
}
