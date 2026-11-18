import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

/** Expediente capturado del paciente. @post 200/401/404 del backend; 404 si el ID no tiene formato. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}/record`, { method: 'GET' });
}
