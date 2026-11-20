import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const origin = process.env.API_BASE_URL || 'http://localhost:8000';
  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, origin);
  const headers = new Headers(request.headers);
  for (const key of ['host', 'connection', 'content-length', 'accept-encoding', 'transfer-encoding']) headers.delete(key);
  try {
    const upstream = await fetch(target, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(), cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const output = new Headers(upstream.headers);
    for (const key of ['content-encoding', 'content-length', 'connection', 'transfer-encoding', 'set-cookie']) output.delete(key);
    for (const cookie of upstream.headers.getSetCookie()) output.append('set-cookie', cookie);
    output.set('cache-control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers: output });
  } catch {
    return Response.json({ error: { code: 502, message: 'Сервис временно недоступен. Попробуйте немного позже.' } }, { status: 502 });
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE, proxy as PATCH, proxy as HEAD, proxy as OPTIONS };
