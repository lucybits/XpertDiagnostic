/** Catálogos de la base de conocimiento para la captura estructurada (P-102). */

/** Nombres que admite /api/catalogs/{name}; los mismos que el backend (CatalogService). */
export const CATALOG_NAMES = ['sintomas', 'signos', 'estudios-laboratorio', 'comorbilidades', 'enfermedades'] as const;

export type CatalogName = (typeof CATALOG_NAMES)[number];

/**
 * Elemento de catálogo tal como lo devuelve el backend.
 * @inv idEnfermedad es la enfermedad a la que pertenece; null en el catálogo de enfermedades.
 * @inv unidades y límites solo existen en elementos con valor medible.
 */
export interface CatalogItem {
  id: string;
  descripcion: string;
  idEnfermedad: string | null;
  unidades: string | null;
  limiteInferior: number | null;
  limiteSuperior: number | null;
}
