import { NextResponse } from 'next/server';

import { User, Conversation, Message, Attachment, GroupInvitation } from '@/lib/models.mjs';

import { ensure, objectId } from '@/lib/validation.mjs';

export async function downloadFile(request, { user, id }) {
  const uid = user?._id;

  const file = await Attachment.findById(objectId(id)).select('+data');
  ensure(file, 'File not found.', 404);
  const own = String(file.owner) === String(uid);
  if (!own) {
    let avatar =
      (await User.exists({ avatar: `/api/files/${file._id}` })) ||
      (await Conversation.exists({ avatar: `/api/files/${file._id}`, members: uid }));
    if (!avatar) {
      const group = await Conversation.findOne({ avatar: `/api/files/${file._id}` })
        .select('_id')
        .lean();
      if (group)
        avatar = await GroupInvitation.exists({
          group: group._id,
          to: uid,
          expiresAt: { $gt: new Date() },
        });
    }
    if (!avatar) {
      const conversations = await Conversation.find({ members: uid }).select('_id').lean();
      ensure(
        await Message.exists({
          attachment: file._id,
          conversation: { $in: conversations.map((c) => c._id) },
        }),
        'File not available.',
        403,
      );
    }
  }
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.size),
      'Content-Disposition': `${file.mime.startsWith('image/') || file.mime.startsWith('audio/') ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
