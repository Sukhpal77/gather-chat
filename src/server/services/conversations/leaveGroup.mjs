import { json } from '@/server/http.mjs';

import { Conversation, Message, GroupInvitation } from '@/lib/models.mjs';

import { ensure } from '@/lib/validation.mjs';
import { membership, notifyMembers } from '@/lib/chat.mjs';

export async function leaveGroup(request, { user, id }) {
  const uid = user?._id;

  const conversation = await membership(id, uid);
  ensure(conversation.kind === 'group', 'Only groups can be left.');
  const oldMembers = [...conversation.members];
  const withoutUser = (field) => ({
    $filter: {
      input: { $ifNull: [`$${field}`, []] },
      as: 'member',
      cond: { $ne: ['$$member', uid] },
    },
  });
  const updated = await Conversation.findOneAndUpdate(
    { _id: id, members: uid },
    [
      {
        $set: {
          members: withoutUser('members'),
          admins: withoutUser('admins'),
          pinnedBy: withoutUser('pinnedBy'),
          archivedBy: withoutUser('archivedBy'),
          mutedBy: withoutUser('mutedBy'),
        },
      },
      {
        $set: {
          owner: {
            $cond: [
              { $eq: ['$owner', uid] },
              { $ifNull: [{ $arrayElemAt: ['$members', 0] }, null] },
              '$owner',
            ],
          },
        },
      },
    ],
    { new: true },
  );
  ensure(updated, 'You are no longer a member.', 404);
  if (!updated.members.length) {
    const deleted = await Conversation.findOneAndDelete({ _id: id, members: { $size: 0 } });
    if (deleted) {
      await Message.deleteMany({ conversation: id });
      await GroupInvitation.deleteMany({ group: id });
    }
  }
  notifyMembers([...oldMembers, ...updated.members], 'conversations:updated', {});
  return json({ ok: true });
}
