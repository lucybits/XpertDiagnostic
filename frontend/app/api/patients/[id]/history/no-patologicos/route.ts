import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';
import { NON_PATHOLOGICAL_QUESTIONS } from '@/types/patient';

/**
 * Guarda los antecedentes no patológicos (P-159).
 * @pre El cuerpo trae las siete respuestas como booleanos.
 * @post 400 si falta alguna o no es booleana (sin llamar al backend). Solo reenvía esas siete.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || NON_PATHOLOGICAL_QUESTIONS.some(({ key }) => typeof body[key] !== 'boolean')) {
    return errorResponse(400, 'Datos inválidos');
  }
  const data = Object.fromEntries(NON_PATHOLOGICAL_QUESTIONS.map(({ key }) => [key, body[key]]));
  return forwardWithSession(request, `/api/patients/${id}/history/no-patologicos`, { method: 'PUT', body: data });
}
