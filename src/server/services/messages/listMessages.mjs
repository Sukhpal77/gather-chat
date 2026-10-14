import { json } from '@/server/http.mjs';

import { Message } from '@/lib/models.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { membership, messageJSON } from '@/lib/chat.mjs';

export async function listMessages(request, { user, id }) {
  const uid = user?._id;

  const conversation = await membership(id, uid);

  const before = new URL(request.url).searchParams.get('before');
  const query = { conversation: conversation._id };
  if (before) {
    const cursor = await Message.findOne({
      _id: objectId(before),
      conversation: conversation._id,
    }).lean();
    ensure(cursor, 'Message cursor not found.', 404);
    query.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ];
  }
  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(51)
    .populate('sender attachment')
    .lean();
  const hasMore = messages.length > 50;
  return json({ messages: messages.slice(0, 50).reverse().map(messageJSON), hasMore });
}
