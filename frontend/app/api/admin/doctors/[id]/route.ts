import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession, parseDoctorId, readJsonObject } from '@/lib/backendSession';
import { validateDoctorUpdate } from '@/lib/doctorValidation';

/**
 * Edita nombre, especialidad y cédula de un médico (ESP-007).
 * @pre El cuerpo es JSON con { nombreCompleto, especialidad, cedulaProfesional }.
 * @post 400 si el ID o los datos no cumplen las reglas (sin llamar al backend).
 * @post 200/401/403/404/409/5xx: el código y el cuerpo del backend.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = parseDoctorId((await params).id);
  if (id === null) return errorResponse(404, 'No se encontró al médico.');

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, 'Datos inválidos');

  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const result = validateDoctorUpdate({
    nombreCompleto: text(body.nombreCompleto),
    especialidad: text(body.especialidad),
    cedulaProfesional: text(body.cedulaProfesional),
  });
  if (!result.ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, `/api/admin/doctors/${id}`, { method: 'PUT', body: result.data });
}
