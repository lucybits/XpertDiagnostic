import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession, parseDoctorId, readJsonObject } from '@/lib/backendSession';

/**
 * Activa o desactiva la cuenta de un médico (ESP-007). Baja lógica: no se borra ningún dato.
 * @pre El cuerpo es JSON con { activo: boolean }.
 * @post 400 si activo no es booleano (sin llamar al backend); 200/401/403/404/5xx del backend.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = parseDoctorId((await params).id);
  if (id === null) return errorResponse(404, 'No se encontró al médico.');

  const body = await readJsonObject(request);
  if (typeof body?.activo !== 'boolean') return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, `/api/admin/doctors/${id}/status`, {
    method: 'PUT',
    body: { activo: body.activo },
  });
}
