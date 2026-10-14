import { json } from '@/server/http.mjs';

import { Attachment } from '@/lib/models.mjs';
import { limit } from '@/lib/auth.mjs';
import { ensure, text } from '@/lib/validation.mjs';

export async function uploadFile(request, { user, id }) {
  const uid = user?._id;

  await limit(`uploads:${uid}`, 20, 1);
  ensure(
    Number(request.headers.get('content-length') || 0) <= 9 * 1024 * 1024,
    'Files must be 8 MB or smaller.',
    413,
  );
  const form = await request.formData();
  const file = form.get('file');
  ensure(
    file && typeof file.arrayBuffer === 'function' && file.size > 0 && file.size <= 8 * 1024 * 1024,
    'Choose a file up to 8 MB.',
  );
  const allowed = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'application/pdf',
    'text/plain',
  ];
  const mime = file.type.split(';')[0];
  ensure(allowed.includes(mime), 'Supported files: images, audio, PDF, and plain text.');
  const attachment = await Attachment.create({
    owner: uid,
    name: file.name.slice(0, 160),
    mime,
    size: file.size,
    data: Buffer.from(await file.arrayBuffer()),
  });
  return json(
    {
      attachment: {
        id: String(attachment._id),
        name: attachment.name,
        mime,
        size: attachment.size,
        url: `/api/files/${attachment._id}`,
      },
    },
    201,
  );
}
