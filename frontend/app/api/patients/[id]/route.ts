import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

/**
 * Elimina de forma definitiva a un paciente y su expediente (P-144). Solo administradores (lo exige
 * el backend).
 * @post 204 si se borró; 404 si el ID no tiene formato o no existe; 401/403/5xx del backend.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}`, { method: 'DELETE' });
}
