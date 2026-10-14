import { json } from '@/server/http.mjs';

import { Friendship } from '@/lib/models.mjs';
import { publicUser } from '@/lib/auth.mjs';

export async function listFriends(request, { user, id }) {
  const uid = user?._id;

  const relationships = await Friendship.find({ $or: [{ from: uid }, { to: uid }] })
    .populate('from to')
    .lean();
  return json({
    friends: relationships.map((r) => ({
      id: String(r._id),
      status: r.status,
      incoming: String(r.to._id) === String(uid),
      blockedByMe: String(r.blockedBy) === String(uid),
      user: publicUser(String(r.from._id) === String(uid) ? r.to : r.from),
    })),
  });
}
