import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

const TREATMENT_ID = /^[A-Z]{5}\d{5}TRATA\d{5}$/;

/**
 * Guarda el tratamiento indicado.
 * @pre El cuerpo es JSON con { idTratamiento }.
 * @post 400 si el ID no tiene formato (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as { idTratamiento?: unknown } | null;
  const treatmentId = body?.idTratamiento;
  if (typeof treatmentId !== 'string' || !TREATMENT_ID.test(treatmentId)) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/patients/${id}/treatment`, {
    method: 'PUT',
    body: { idTratamiento: treatmentId },
  });
}
