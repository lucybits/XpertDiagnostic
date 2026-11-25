import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isValidationState, VALIDATION_STATES } from '@/types/validation';

/**
 * Pacientes pendientes (?estado=P, por defecto) o confirmados (?estado=C) para el médico internista (P-151).
 * @post 400 si el estado no es P ni C (sin llamar al backend).
 */
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('estado') ?? VALIDATION_STATES.pending;
  if (!isValidationState(state)) return errorResponse(400, 'Datos inválidos');
  return forwardWithSession(request, `/api/validations?estado=${state}`, { method: 'GET' });
}
