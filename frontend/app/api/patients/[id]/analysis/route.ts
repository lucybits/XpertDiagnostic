import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';

/** Analiza los hallazgos guardados con la máquina de inferencia registrada en el backend. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  return forwardWithSession(request, `/api/patients/${id}/analysis`, { method: 'POST' });
}
