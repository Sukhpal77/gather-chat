import { json } from '@/server/http.mjs';

import { Conversation, Message } from '@/lib/models.mjs';
import { publicUser } from '@/lib/auth.mjs';

export async function listConversations(request, { user, id }) {
  const uid = user?._id;

  const list = await Conversation.find({ members: uid })
    .sort({ lastMessageAt: -1 })
    .populate('members')
    .lean();
  const unread = await Message.aggregate([
    { $match: { conversation: { $in: list.map((c) => c._id) }, readBy: { $ne: uid } } },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  return json({
    conversations: list.map((c) => ({
      id: String(c._id),
      kind: c.kind,
      name:
        c.kind === 'group'
          ? c.name
          : c.members.find((m) => String(m._id) !== String(uid))?.name || 'Deleted account',
      description: c.description,
      avatar: c.avatar || '',
      ownerId: String(c.owner),
      adminIds: (c.admins || []).map(String),
      members: c.members.map((m) => publicUser(m)),
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      pinned: c.pinnedBy.some((id) => String(id) === String(uid)),
      archived: c.archivedBy.some((id) => String(id) === String(uid)),
      muted: (c.mutedBy || []).some((id) => String(id) === String(uid)),
      unread: unread.find((u) => String(u._id) === String(c._id))?.count || 0,
    })),
  });
}
