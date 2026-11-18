import type { CatalogItem } from '@/types/catalog';
import type { FindingInput } from '@/types/record';

/** Reglas de la captura estructurada (P-103), compartidas por las rutas de servidor y la vista. */

const PATIENT_ID = /^PACIE\d{5}$/;
const DISEASE_ID = /^[A-Z]{5}\d{5}$/;
const REGISTRY_ID = /^[A-Za-z0-9_]{1,20}$/;
const MEASURE = /^-?\d{1,9}(\.\d{1,3})?$/;
const MAX_FINDINGS = 100;

/** @post true si el texto tiene el formato de IdPaciente (PACIE + 5 dígitos). */
export const isPatientId = (value: unknown): value is string => typeof value === 'string' && PATIENT_ID.test(value);

/** @post true si el texto tiene el formato de IdEnfermedad (5 letras + 5 dígitos). */
export const isDiseaseId = (value: unknown): value is string => typeof value === 'string' && DISEASE_ID.test(value);

/**
 * Normaliza una medición escrita por el médico: acepta coma decimal y quita espacios.
 * @post '' → null (presente, sin medición); número válido → texto con punto; otro → undefined (inválido).
 */
export function normalizeMeasure(text: string): string | null | undefined {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  return MEASURE.test(clean) ? clean : undefined;
}

/**
 * Valida el cuerpo de "guardar hallazgos".
 * @post La lista (hasta 100, sin IdRegistro repetido), o null si no cumple la forma.
 */
export function parseFindingInputs(body: unknown): FindingInput[] | null {
  const list = (body as { hallazgos?: unknown } | null)?.hallazgos;
  if (!Array.isArray(list) || list.length > MAX_FINDINGS) return null;
  const seen = new Set<string>();
  const result: FindingInput[] = [];
  for (const item of list) {
    const { idRegistro, valor } = (item ?? {}) as { idRegistro?: unknown; valor?: unknown };
    if (typeof idRegistro !== 'string' || !REGISTRY_ID.test(idRegistro) || seen.has(idRegistro)) return null;
    if (valor !== null && valor !== undefined && (typeof valor !== 'string' || !MEASURE.test(valor))) return null;
    seen.add(idRegistro);
    result.push({ idRegistro, valor: typeof valor === 'string' ? valor : null });
  }
  return result;
}

/** Opción que ve el médico: una por descripción, aunque el catálogo la tenga en varias enfermedades. */
export interface CatalogOption {
  /** IdRegistro representativo; el backend guarda también los equivalentes (P-103). */
  id: string;
  label: string;
  /** Unidades si se puede medir (p. ej. "mg/dL"); null si solo es presente o ausente. */
  units: string | null;
}

/**
 * Une las entradas del catálogo con la misma descripción (sin distinguir mayúsculas ni espacios).
 * @post Una opción por descripción, en orden alfabético; conserva las unidades si alguna las tiene.
 */
export function toCatalogOptions(items: readonly CatalogItem[]): CatalogOption[] {
  const byKey = new Map<string, CatalogOption>();
  for (const item of items) {
    const key = item.descripcion.trim().toLowerCase();
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, { id: item.id, label: item.descripcion.trim(), units: item.unidades });
    else if (!existing.units && item.unidades) existing.units = item.unidades;
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/**
 * Filtra opciones por texto, sin distinguir acentos ni mayúsculas.
 * @post Las opciones cuya etiqueta contiene el texto; todas si el texto está vacío.
 */
export function filterOptions(options: readonly CatalogOption[], query: string): CatalogOption[] {
  const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const needle = plain(query.trim());
  return needle === '' ? [...options] : options.filter((option) => plain(option.label).includes(needle));
}
