import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isDiseaseId, isPatientId } from '@/lib/recordRules';

/**
 * Asigna o quita la enfermedad preexistente.
 * @pre El cuerpo es JSON con { idEnfermedad: string | null }.
 * @post 400 si el ID de enfermedad no tiene formato (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as { idEnfermedad?: unknown } | null;
  const idEnfermedad = body?.idEnfermedad ?? null;
  if (idEnfermedad !== null && !isDiseaseId(idEnfermedad)) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/patients/${id}/preexisting-disease`, { method: 'PUT', body: { idEnfermedad } });
}
