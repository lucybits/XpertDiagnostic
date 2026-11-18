import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isDiseaseId, isPatientId } from '@/lib/recordRules';

/**
 * Confirma la enfermedad diagnosticada.
 * @pre El cuerpo es JSON con { idEnfermedad }.
 * @post 400 si el ID no tiene formato (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as { idEnfermedad?: unknown } | null;
  if (!isDiseaseId(body?.idEnfermedad)) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/patients/${id}/diagnosis`, {
    method: 'PUT',
    body: { idEnfermedad: body.idEnfermedad },
  });
}
