import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

type Context = { params: Promise<{ id: string }> };

/** Estado de la validación del diagnóstico del paciente (P-151). */
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}/validation`, { method: 'GET' });
}

/** El médico tratante envía el diagnóstico diferencial al médico internista (P-151). */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}/validation`, { method: 'POST' });
}
