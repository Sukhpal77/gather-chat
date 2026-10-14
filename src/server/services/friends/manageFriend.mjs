import { json, readBody as body } from '@/server/http.mjs';

import { Friendship } from '@/lib/models.mjs';

import { AppError, ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';

export async function manageFriend(request, { user, id }) {
  const uid = user?._id;
  const method = request.method;
  const relation = await Friendship.findOne({
    _id: objectId(id),
    $or: [{ from: uid }, { to: uid }],
  });
  ensure(relation, 'Friend request not found.', 404);
  if (method === 'DELETE') {
    ensure(
      relation.status !== 'blocked' || String(relation.blockedBy) === String(uid),
      'Only the person who blocked can unblock.',
      403,
    );
    await relation.deleteOne();
  } else {
    const { action } = await body(request);
    if (action === 'accept') {
      ensure(
        relation.status === 'pending' && String(relation.to) === String(uid),
        'You cannot accept this request.',
        403,
      );
      relation.status = 'accepted';
    } else if (action === 'block') {
      ensure(
        relation.status !== 'blocked' || String(relation.blockedBy) === String(uid),
        'This person has blocked you.',
        403,
      );
      relation.status = 'blocked';
      relation.blockedBy = uid;
    } else throw new AppError('Invalid friend action.');
    await relation.save();
  }
  notifyMembers([relation.from, relation.to], 'friends:updated', {});
  return json({ ok: true });
}
