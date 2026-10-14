import { json } from '@/server/http.mjs';

import { User, Friendship } from '@/lib/models.mjs';
import { publicUser, limit } from '@/lib/auth.mjs';
import { pairKey } from '@/lib/validation.mjs';

export async function searchPeople(request, { user, id }) {
  const uid = user?._id;

  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80) || '';
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const people = await User.find({
    _id: { $ne: uid },
    ...(q
      ? { $or: [{ name: new RegExp(escaped, 'i') }, { username: new RegExp(escaped, 'i') }] }
      : {}),
  })
    .limit(40)
    .lean();
  const relationships = await Friendship.find({ $or: [{ from: uid }, { to: uid }] }).lean();
  return json({
    people: people.map((person) => {
      const relation = relationships.find((r) => r.pair === pairKey(uid, person._id));
      return {
        ...publicUser(person),
        relationship: relation
          ? {
              id: String(relation._id),
              status: relation.status,
              incoming: String(relation.to) === String(uid),
              blockedByMe: String(relation.blockedBy) === String(uid),
            }
          : null,
      };
    }),
  });
}
