import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';
import { NON_PATHOLOGICAL_QUESTIONS } from '@/types/patient';

/**
 * Guarda los antecedentes no patológicos del interrogatorio (P-145). Solo el médico tratante (lo exige el backend).
 * @pre El cuerpo es JSON con una respuesta booleana por pregunta; lo que falte o no sea true cuenta como "no".
 * @post 404 si el ID no tiene formato (sin llamar al backend); 200/401/403/404 del backend.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof body !== 'object' || body === null) return errorResponse(400, 'Datos inválidos');

  const answers = Object.fromEntries(NON_PATHOLOGICAL_QUESTIONS.map(({ key }) => [key, body[key] === true]));
  return forwardWithSession(request, `/api/patients/${id}/non-pathological-history`, { method: 'PUT', body: answers });
}
