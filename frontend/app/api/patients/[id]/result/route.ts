import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

/** Entradas y salidas del paciente (interfaz de salida, P-105). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}/result`, { method: 'GET' });
}
