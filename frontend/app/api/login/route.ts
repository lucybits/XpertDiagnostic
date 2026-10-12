const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:5140';

export async function POST(request: Request) {
  const response = await fetch(new URL('/api/auth/login', backendUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}
