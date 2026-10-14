import { json, readBody as body } from '@/server/http.mjs';

import { Friendship, Conversation } from '@/lib/models.mjs';

import { ensure, text, objectId, pairKey } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';

export async function createConversation(request, { user, id }) {
  const uid = user?._id;

  const input = await body(request);
  let conversation;
  if (input.kind === 'direct') {
    const target = objectId(input.userId);
    ensure(
      await Friendship.exists({ pair: pairKey(uid, target), status: 'accepted' }),
      'Add this person as a friend before chatting.',
      403,
    );
    conversation = await Conversation.findOneAndUpdate(
      { directKey: pairKey(uid, target) },
      { $setOnInsert: { kind: 'direct', members: [uid, target], owner: uid } },
      { upsert: true, new: true },
    );
  } else {
    ensure(input.kind === 'group', 'Invalid conversation type.');
    ensure(
      Array.isArray(input.memberIds) && input.memberIds.length >= 1 && input.memberIds.length <= 30,
      'Choose 1–30 friends.',
    );
    const targets = [...new Set(input.memberIds.map(objectId))].filter((id) => id !== String(uid));
    ensure(targets.length >= 1, 'Choose at least one friend.');
    for (const target of targets)
      ensure(
        await Friendship.exists({ pair: pairKey(uid, target), status: 'accepted' }),
        'Only accepted friends can be invited.',
        403,
      );
    conversation = await Conversation.create({
      kind: 'group',
      name: text(input.name, 'Group name', 80),
      description: text(input.description || '', 'Description', 240, false),
      members: [uid, ...targets],
      owner: uid,
    });
  }
  notifyMembers(conversation.members, 'conversations:updated', {});
  return json({ id: String(conversation._id) }, 201);
}
