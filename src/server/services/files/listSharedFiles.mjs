import { Message } from '@/lib/models.mjs';
import { membership, messageJSON } from '@/lib/chat.mjs';
import { json } from '@/server/http.mjs';
import { objectId } from '@/lib/validation.mjs';

export async function listSharedFiles(request, { user, id }) {
  await membership(id, user._id);
  const before = new URL(request.url).searchParams.get('before');
  const messages = await Message.find({
    conversation: id,
    attachment: { $ne: null },
    ...(before ? { _id: { $lt: objectId(before) } } : {}),
  })
    .sort({ _id: -1 })
    .limit(21)
    .populate('sender attachment')
    .lean();
  return json({ files: messages.slice(0, 20).map(messageJSON), hasMore: messages.length > 20 });
}
