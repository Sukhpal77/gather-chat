import { Conversation } from '@/lib/models.mjs';
import { json, readBody } from '@/server/http.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupOwner } from './requireGroupOwner.mjs';
export async function setAdmin(request, { user, id, memberId }) {
  const group = await requireGroupOwner(id, user._id);
  objectId(memberId);
  ensure(memberId !== String(group.owner), 'The owner already has all group permissions.');
  const { role } = await readBody(request);
  ensure(['admin', 'member'].includes(role), 'Choose admin or member.');
  const updated = await Conversation.findOneAndUpdate(
    { _id: id, owner: user._id, members: memberId },
    { [role === 'admin' ? '$addToSet' : '$pull']: { admins: memberId } },
    { new: true },
  );
  ensure(updated, 'Member not found or ownership changed.', 409);
  notifyMembers(group.members, 'conversations:updated', {});
  return json({ ok: true });
}
