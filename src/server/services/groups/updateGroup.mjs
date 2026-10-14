import { Conversation, Attachment } from '@/lib/models.mjs';
import { json, readBody } from '@/server/http.mjs';
import { ensure, text } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupManager, groupManagerQuery } from './requireGroupManager.mjs';

export async function updateGroup(request, { user, id }) {
  const group = await requireGroupManager(id, user._id);
  const input = await readBody(request);
  const update = {};
  if (input.name !== undefined) update.name = text(input.name, 'Group name', 80);
  if (input.description !== undefined)
    update.description = text(input.description, 'Description', 240, false);
  if (input.avatar !== undefined) {
    ensure(
      input.avatar === '' || /^\/api\/files\/[a-f\d]{24}$/.test(input.avatar),
      'Invalid group photo.',
    );
    if (input.avatar)
      ensure(
        await Attachment.exists({
          _id: input.avatar.split('/').pop(),
          owner: user._id,
          mime: /^image\//,
        }),
        'Group photo not found.',
      );
    update.avatar = input.avatar;
  }
  const updated = await Conversation.findOneAndUpdate(
    groupManagerQuery(id, user._id),
    { $set: update },
    { new: true, runValidators: true },
  );
  ensure(updated, 'Group ownership changed. Refresh and try again.', 409);
  notifyMembers(group.members, 'conversations:updated', {});
  return json({ ok: true });
}
