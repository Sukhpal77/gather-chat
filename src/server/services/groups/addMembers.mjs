import { Conversation, Friendship } from '@/lib/models.mjs';
import mongoose from 'mongoose';
import { json, readBody } from '@/server/http.mjs';
import { ensure, objectId, pairKey } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupManager, groupManagerQuery } from './requireGroupManager.mjs';

export async function addMembers(request, { user, id }) {
  const group = await requireGroupManager(id, user._id);
  const input = await readBody(request);
  ensure(
    Array.isArray(input.memberIds) && input.memberIds.length > 0 && input.memberIds.length <= 30,
    'Choose 1–30 friends.',
  );
  const targets = [...new Set(input.memberIds.map(objectId))].filter(
    (target) => !group.members.some((member) => String(member) === target),
  );
  ensure(targets.length > 0, 'These people are already members.');
  for (const target of targets)
    ensure(
      await Friendship.exists({ pair: pairKey(user._id, target), status: 'accepted' }),
      'Only your accepted friends can be added.',
      403,
    );
  const updated = await Conversation.findOneAndUpdate(
    {
      ...groupManagerQuery(id, user._id),
      $expr: {
        $lte: [
          {
            $size: {
              $setUnion: ['$members', targets.map((target) => new mongoose.Types.ObjectId(target))],
            },
          },
          31,
        ],
      },
    },
    { $addToSet: { members: { $each: targets } } },
    { new: true },
  );
  ensure(updated, 'The group is full or ownership changed. Refresh and try again.', 409);
  notifyMembers(updated.members, 'conversations:updated', {});
  return json({ ok: true });
}
