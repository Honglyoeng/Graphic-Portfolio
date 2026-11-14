// Shared helpers for Backstage online (Vercel Functions). Files starting with "_" are not routes.
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const DATA_PATH = 'data/projects.json';
export const MAX_BYTES = 40 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const COOKIE = 'backstage';
const DAYS = 30;

export const json = (status, obj, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

const password = () => process.env.ADMIN_PASSWORD || '';
const key = () => createHash('sha256').update('lotus-backstage:' + password()).digest();
const sign = (v) => createHmac('sha256', key()).update(v).digest('base64url');

export function passwordMatches(input) {
  const a = createHash('sha256').update(String(input || '')).digest();
  const b = createHash('sha256').update(password()).digest();
  return password().length > 0 && timingSafeEqual(a, b);
}

export function sessionCookie() {
  const exp = String(Date.now() + DAYS * 864e5);
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAYS * 86400}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function isAuthed(request) {
  if (!password()) return false;
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = Buffer.from(sign(exp)), got = Buffer.from(sig);
  return good.length === got.length && timingSafeEqual(good, got);
}

// Reject cross-site form posts (the cookie is SameSite=Strict as well).
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export const hasReadWriteToken = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
