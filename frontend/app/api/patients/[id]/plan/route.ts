import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { isPatientId } from '@/lib/recordRules';
import { CARE_PLAN_LIMITS } from '@/types/result';

const optionalText = (value: unknown, max: number): string | null | undefined => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.length > max) return undefined;
  return value.trim() === '' ? null : value;
};

/**
 * Guarda el plan, pronóstico y seguimiento escritos por el médico.
 * @pre El cuerpo es JSON con { planIndicado, pronostico, seguimiento }.
 * @post 400 si no cumple los límites de PLANES (sin llamar al backend).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPatientId(id)) return errorResponse(404, 'No existe ese paciente.');
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const plan = typeof body?.planIndicado === 'string' ? body.planIndicado.trim() : '';
  const pronostico = optionalText(body?.pronostico, CARE_PLAN_LIMITS.pronosticoMax);
  const seguimiento = optionalText(body?.seguimiento, CARE_PLAN_LIMITS.seguimientoMax);
  if (plan.length < CARE_PLAN_LIMITS.planMin || plan.length > CARE_PLAN_LIMITS.planMax || pronostico === undefined || seguimiento === undefined) {
    return errorResponse(400, 'Datos inválidos');
  }
  return forwardWithSession(request, `/api/patients/${id}/plan`, {
    method: 'PUT',
    body: { planIndicado: plan, pronostico, seguimiento },
  });
}
