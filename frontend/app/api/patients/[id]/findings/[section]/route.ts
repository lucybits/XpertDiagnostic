import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId, parseFindingInputs } from '@/lib/recordRules';
import { FINDING_SECTIONS } from '@/types/record';

/**
 * Guarda los hallazgos de una sección (reemplaza los anteriores de ese tipo).
 * @pre El cuerpo es JSON con { hallazgos: [{ idRegistro, valor }] }.
 * @post 400 si el cuerpo no cumple las reglas; 404 si la sección o el ID no existen (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!isPatientId(id) || !(FINDING_SECTIONS as readonly string[]).includes(section)) {
    return errorResponse(404, 'No existe esa sección.');
  }
  const hallazgos = parseFindingInputs(await request.json().catch(() => null));
  if (hallazgos === null) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/patients/${id}/findings/${section}`, { method: 'PUT', body: { hallazgos } });
}
