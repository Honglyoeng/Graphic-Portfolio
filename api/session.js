import { json, isAuthed, hasReadWriteToken } from './_lib.js';

export function GET(request) {
  return json(200, {
    online: true,
    configured: Boolean(process.env.ADMIN_PASSWORD),
    authed: isAuthed(request),
    uploadMode: hasReadWriteToken() ? 'token' : 'presigned',
  });
}
