import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';
import { PATHOLOGICAL_FIELDS, PATHOLOGICAL_MAX_LENGTH } from '@/types/history';

/**
 * Guarda los antecedentes patológicos (P-159).
 * @pre Cada campo es texto (hasta 255 caracteres) o null.
 * @post 400 si algún campo tiene otro tipo o se pasa del límite (sin llamar al backend). Solo reenvía los
 *       veintiún campos conocidos.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return errorResponse(400, 'Datos inválidos');

  const data: Record<string, string | null> = {};
  for (const { key } of PATHOLOGICAL_FIELDS) {
    const value = body[key] ?? null;
    if (value !== null && (typeof value !== 'string' || value.length > PATHOLOGICAL_MAX_LENGTH)) {
      return errorResponse(400, 'Datos inválidos');
    }
    data[key] = value;
  }
  return forwardWithSession(request, `/api/patients/${id}/history/patologicos`, { method: 'PUT', body: data });
}
