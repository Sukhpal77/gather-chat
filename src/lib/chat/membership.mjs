import { Conversation, Friendship } from '../models.mjs';
import { ensure, objectId, pairKey } from '../validation.mjs';
export async function membership(id, userId) {
  const conversation = await Conversation.findOne({ _id: objectId(id), members: userId });
  ensure(conversation, 'Conversation not found.', 404);
  if (conversation.kind === 'direct') {
    const other = conversation.members.find((id) => String(id) !== String(userId));
    const blocked = await Friendship.exists({ pair: pairKey(userId, other), status: 'blocked' });
    ensure(!blocked, 'This conversation is blocked.', 403);
  }
  return conversation;
}
