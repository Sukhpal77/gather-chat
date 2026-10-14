import { json, readBody as body } from '@/server/http.mjs';

import { Conversation } from '@/lib/models.mjs';

import { ensure, text } from '@/lib/validation.mjs';
import { membership, notifyMembers } from '@/lib/chat.mjs';

export async function updateConversation(request, { user, id }) {
  const uid = user?._id;

  const conversation = await membership(id, uid);
  const input = await body(request);
  for (const [flag, field] of [
    ['pinned', 'pinnedBy'],
    ['archived', 'archivedBy'],
    ['muted', 'mutedBy'],
  ]) {
    if (typeof input[flag] === 'boolean')
      await Conversation.updateOne(
        { _id: conversation._id },
        { [input[flag] ? '$addToSet' : '$pull']: { [field]: uid } },
      );
  }
  if (input.name !== undefined) {
    ensure(
      conversation.kind === 'group' && String(conversation.owner) === String(uid),
      'Only the group owner can rename it.',
      403,
    );
    await Conversation.updateOne(
      { _id: conversation._id },
      { name: text(input.name, 'Group name', 80) },
    );
  }
  notifyMembers(conversation.members, 'conversations:updated', {});
  return json({ ok: true });
}
