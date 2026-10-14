import { json, readBody as body } from '@/server/http.mjs';

import { User, Friendship } from '@/lib/models.mjs';

import { ensure, objectId, pairKey } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';

export async function requestFriend(request, { user, id }) {
  const uid = user?._id;

  const input = await body(request);
  const target = objectId(input.userId);
  ensure(target !== String(uid), 'You cannot add yourself.');
  ensure(await User.exists({ _id: target }), 'Person not found.', 404);
  const relation = await Friendship.create({ pair: pairKey(uid, target), from: uid, to: target });
  notifyMembers([uid, target], 'friends:updated', {});
  return json({ id: String(relation._id) }, 201);
}
