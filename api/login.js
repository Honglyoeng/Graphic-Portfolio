import { json, passwordMatches, sessionCookie, clearCookie, sameOrigin } from './_lib.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json(403, { error: 'Forbidden' });
  if (!process.env.ADMIN_PASSWORD) return json(503, { error: 'ADMIN_PASSWORD is not set on Vercel yet.' });
  const { password, logout } = await request.json().catch(() => ({}));
  if (logout) return json(200, { ok: true }, { 'Set-Cookie': clearCookie() });
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json(401, { error: 'Wrong password' });
  }
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie() });
}
