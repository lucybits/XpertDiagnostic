/** Respuesta de la API con el cuerpo ya interpretado como JSON (o null si no lo era). */
export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

/**
 * Envía un cuerpo JSON por POST e interpreta la respuesta.
 *
 * @pre url es una ruta o URL válida y body se puede serializar a JSON.
 * @post Si el servidor responde (con cualquier código HTTP), devuelve { ok, status, data }.
 * @post Si no hay conexión, la promesa se rechaza; quien llama decide cómo informarlo.
 */
export async function postJson<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  return toApiResponse<T>(response);
}

/**
 * Envía un cuerpo JSON por PUT e interpreta la respuesta.
 *
 * @post Igual que postJson: { ok, status, data } si el servidor responde; rechaza si no hay conexión.
 *       Una respuesta 204 sin cuerpo da data == null.
 */
export async function putJson<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  return toApiResponse<T>(response);
}

/**
 * Hace un DELETE e interpreta la respuesta.
 *
 * @post Igual que postJson: { ok, status, data } si el servidor responde; rechaza si no hay conexión.
 *       Una respuesta 204 sin cuerpo da data == null.
 */
export async function deleteJson<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
  return toApiResponse<T>(response);
}

/**
 * Hace un GET e interpreta la respuesta como JSON.
 *
 * @post Igual que postJson: { ok, status, data } si el servidor responde; rechaza si no hay conexión.
 */
export async function getJson<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  return toApiResponse<T>(response);
}

async function toApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data };
}
