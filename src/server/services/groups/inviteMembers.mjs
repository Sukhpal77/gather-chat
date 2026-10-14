import { Friendship, GroupInvitation } from '@/lib/models.mjs';
import { json, readBody } from '@/server/http.mjs';
import { ensure, objectId, pairKey } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupManager } from './requireGroupManager.mjs';
export async function inviteMembers(request, { user, id }) {
  const group = await requireGroupManager(id, user._id);
  const { memberIds } = await readBody(request);
  ensure(
    Array.isArray(memberIds) && memberIds.length >= 1 && memberIds.length <= 30,
    'Choose 1–30 friends.',
  );
  const targets = [...new Set(memberIds.map(objectId))];
  for (const target of targets) {
    ensure(
      !group.members.some((member) => String(member) === target),
      'This person is already a member.',
    );
    ensure(
      await Friendship.exists({ pair: pairKey(user._id, target), status: 'accepted' }),
      'Only your accepted friends can be invited.',
      403,
    );
  }
  for (const target of targets)
    await GroupInvitation.findOneAndUpdate(
      { group: id, to: target },
      { from: user._id, expiresAt: new Date(Date.now() + 7 * 86400000) },
      { upsert: true, new: true },
    );
  notifyMembers([...group.members, ...targets], 'groups:invitations', {});
  return json({ ok: true });
}
