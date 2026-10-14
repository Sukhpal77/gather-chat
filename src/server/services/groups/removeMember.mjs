import { Conversation } from '@/lib/models.mjs';
import { json } from '@/server/http.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupManager, groupManagerQuery } from './requireGroupManager.mjs';

export async function removeMember(request, { user, id, memberId }) {
  const group = await requireGroupManager(id, user._id);
  objectId(memberId);
  ensure(memberId !== String(user._id), 'Use Leave group to remove yourself.');
  ensure(memberId !== String(group.owner), 'The group owner cannot be removed.', 403);
  const isOwner = String(group.owner) === String(user._id);
  ensure(
    isOwner || !(group.admins || []).some((admin) => String(admin) === memberId),
    'Only the owner can remove an admin.',
    403,
  );
  ensure(
    group.members.some((member) => String(member) === memberId),
    'Member not found.',
    404,
  );
  const updated = await Conversation.findOneAndUpdate(
    {
      ...groupManagerQuery(id, user._id),
      owner: isOwner ? user._id : { $ne: memberId },
      ...(isOwner ? {} : { admins: { $ne: memberId } }),
    },
    {
      $pull: {
        members: memberId,
        admins: memberId,
        pinnedBy: memberId,
        archivedBy: memberId,
        mutedBy: memberId,
      },
    },
    { new: true },
  );
  ensure(updated, 'Group ownership changed. Refresh and try again.', 409);
  notifyMembers(group.members, 'conversations:updated', {});
  return json({ ok: true });
}
