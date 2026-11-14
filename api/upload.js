// Gives the browser permission to upload one image straight to Vercel Blob (so large files skip the 4.5 MB function limit).
import { handleUpload, handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { json, isAuthed, sameOrigin, hasReadWriteToken, IMAGE_TYPES, MAX_BYTES } from './_lib.js';

function checkPath(pathname) {
  if (!/^works\/[a-z0-9][a-z0-9._-]{0,80}$/i.test(pathname) || pathname.includes('..')) throw new Error('Bad file name');
}

export async function POST(request) {
  if (!sameOrigin(request)) return json(403, { error: 'Forbidden' });
  const body = await request.json().catch(() => null);
  if (!body) return json(400, { error: 'Bad request' });
  // Only a logged-in Backstage may ask for upload permission (completion callbacks come from Vercel itself).
  const isTokenRequest = body.type === 'blob.generate-client-token' || body.type === 'blob.generate-presigned-url';
  if (isTokenRequest && !isAuthed(request)) return json(401, { error: 'Please log in again' });

  try {
    if (hasReadWriteToken()) {
      const result = await handleUpload({
        body, request,
        onBeforeGenerateToken: async (pathname) => {
          checkPath(pathname);
          return { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
        },
      });
      return json(200, result);
    }
    const result = await handleUploadPresigned({
      body, request,
      getSignedToken: async (pathname) => {
        checkPath(pathname);
        const token = await issueSignedToken({
          pathname, operations: ['put'], allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 10 * 60 * 1000,
        });
        return { token, urlOptions: { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true } };
      },
    });
    return json(200, result);
  } catch (e) {
    return json(400, { error: e.message });
  }
}
