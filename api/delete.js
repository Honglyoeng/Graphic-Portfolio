import { del } from '@vercel/blob';
import { json, isAuthed, sameOrigin } from './_lib.js';

// Backstage only: delete one uploaded image from Blob storage.
export async function POST(request) {
  if (!sameOrigin(request)) return json(403, { error: 'Forbidden' });
  if (!isAuthed(request)) return json(401, { error: 'Please log in again' });
  const { url } = await request.json().catch(() => ({}));
  let u;
  try { u = new URL(url); } catch { return json(400, { error: 'Bad URL' }); }
  if (!u.hostname.endsWith('.blob.vercel-storage.com') || !u.pathname.startsWith('/works/')) {
    return json(400, { error: 'Only uploaded images can be deleted' });
  }
  await del(url);
  return json(200, { ok: true });
}
