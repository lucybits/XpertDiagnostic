import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId, validateHypothesis } from '@/lib/recordRules';

/**
 * Guarda la hipótesis diagnóstica inicial del tratante (P-145). Solo el médico tratante (lo exige el backend).
 * @pre El cuerpo es JSON con { hipotesis } de 3 a 1000 caracteres.
 * @post 400 si el texto no cumple; 404 si el ID no tiene formato (sin llamar al backend); 200/401/403/404 del backend.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as { hipotesis?: unknown } | null;
  const result = validateHypothesis(typeof body?.hipotesis === 'string' ? body.hipotesis : '');
  if (!result.ok) return errorResponse(400, result.message);
  return forwardWithSession(request, `/api/patients/${id}/hypothesis`, { method: 'PUT', body: { hipotesis: result.text } });
}
