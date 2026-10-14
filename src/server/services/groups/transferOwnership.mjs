import { Conversation } from '@/lib/models.mjs';
import { json, readBody } from '@/server/http.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupOwner } from './requireGroupOwner.mjs';

export async function transferOwnership(request, { user, id }) {
  const group = await requireGroupOwner(id, user._id);
  const target = objectId((await readBody(request)).userId);
  ensure(target !== String(user._id), 'Choose another group member.');
  const updated = await Conversation.findOneAndUpdate(
    { _id: id, owner: user._id, members: target },
    { owner: target },
    { new: true },
  );
  ensure(
    updated,
    'The new owner must be a current member, and only the current owner can transfer ownership.',
    409,
  );
  notifyMembers(group.members, 'conversations:updated', {});
  return json({ ok: true });
}
