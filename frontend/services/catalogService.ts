import { getJson } from '@/lib/apiClient';
import type { CatalogItem, CatalogName } from '@/types/catalog';

/**
 * Elementos de un catálogo de la base de conocimiento (P-102).
 * @post Nunca lanza: la lista, o null si no hay sesión o falló el servidor o la red.
 */
export async function getCatalog(name: CatalogName): Promise<CatalogItem[] | null> {
  try {
    const response = await getJson<CatalogItem[]>(`/api/catalogs/${name}`);
    return response.ok && Array.isArray(response.data) ? response.data : null;
  } catch {
    return null;
  }
}
