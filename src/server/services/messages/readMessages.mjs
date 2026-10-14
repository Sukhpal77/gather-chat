import { json, readBody as body } from '@/server/http.mjs';

import { Message } from '@/lib/models.mjs';

import { ensure, objectId } from '@/lib/validation.mjs';
import { membership, notifyMembers } from '@/lib/chat.mjs';

export async function readMessages(request, { user, id }) {
  const uid = user?._id;

  const conversation = await membership(id, uid);
  const { messageId } = await body(request);
  objectId(messageId);
  const cursor = await Message.findOne({ _id: messageId, conversation: conversation._id }).lean();
  ensure(cursor, 'Message not found.', 404);
  await Message.updateMany(
    {
      conversation: conversation._id,
      readBy: { $ne: uid },
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lte: cursor._id } },
      ],
    },
    { $addToSet: { readBy: uid } },
  );
  notifyMembers(conversation.members, 'messages:read', {
    conversationId: id,
    userId: String(uid),
    messageId,
    createdAt: cursor.createdAt,
  });
  return json({ ok: true });
}
