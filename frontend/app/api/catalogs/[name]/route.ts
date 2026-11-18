import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { CATALOG_NAMES, type CatalogName } from '@/types/catalog';

/**
 * Un catálogo de la base de conocimiento (síntomas, signos, estudios, comorbilidades o enfermedades).
 * Solo se reenvían los nombres admitidos; cualquier otro responde 404 sin llamar al backend.
 *
 * @post 200 con los elementos; 401 sin sesión; 404 si el catálogo no existe; 503 si el backend no responde.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!(CATALOG_NAMES as readonly string[]).includes(name)) return errorResponse(404, 'No existe ese catálogo.');
  return forwardWithSession(request, `/api/catalogs/${name as CatalogName}`, { method: 'GET' });
}
