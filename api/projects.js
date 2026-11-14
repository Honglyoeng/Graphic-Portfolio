import { get, put } from '@vercel/blob';
import { json, isAuthed, sameOrigin, DATA_PATH } from './_lib.js';

// Public: the portfolio reads its projects from here.
export async function GET() {
  try {
    const res = await get(DATA_PATH, { access: 'public', useCache: false });
    if (!res || res.statusCode !== 200) return json(404, { error: 'No saved projects yet' });
    const text = await new Response(res.stream).text();
    return new Response(text, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=60' },
    });
  } catch (e) {
    return json(404, { error: 'No saved projects yet' });
  }
}

// Backstage only: save all projects.
export async function POST(request) {
  if (!sameOrigin(request)) return json(403, { error: 'Forbidden' });
  if (!isAuthed(request)) return json(401, { error: 'Please log in again' });
  const data = await request.json().catch(() => null);
  if (!data || !Array.isArray(data.projects)) return json(400, { error: 'Unexpected data' });
  const body = JSON.stringify(data, null, 2);
  if (body.length > 2_000_000) return json(413, { error: 'Too much text' });
  await put(DATA_PATH, body, {
    access: 'public', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 60,
  });
  return json(200, { ok: true });
}
