import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isDiseaseId, isPatientId } from '@/lib/recordRules';

type Context = { params: Promise<{ id: string }> };

/** Paciente, hallazgos y diagnóstico diferencial actual, para el médico internista (P-151). */
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/validations/${id}`, { method: 'GET' });
}

/**
 * El médico internista confirma uno de los candidatos (P-151).
 * @pre El cuerpo es JSON con { idEnfermedad }.
 * @post 400 si el ID no tiene formato (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as { idEnfermedad?: unknown } | null;
  if (!isDiseaseId(body?.idEnfermedad)) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/validations/${id}`, {
    method: 'PUT',
    body: { idEnfermedad: body.idEnfermedad },
  });
}
