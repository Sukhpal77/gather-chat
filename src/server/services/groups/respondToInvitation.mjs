import mongoose from 'mongoose';
import { Conversation, GroupInvitation } from '@/lib/models.mjs';
import { json, readBody } from '@/server/http.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
export async function respondToInvitation(request, { user, invitationId }) {
  const invitation = await GroupInvitation.findOne({
    _id: objectId(invitationId),
    to: user._id,
    expiresAt: { $gt: new Date() },
  });
  ensure(invitation, 'Invitation not found or expired.', 404);
  const { action } = await readBody(request);
  ensure(['accept', 'decline'].includes(action), 'Choose accept or decline.');
  if (action === 'accept') {
    const existing = await Conversation.findById(invitation.group).lean();
    ensure(existing && existing.kind === 'group', 'Group no longer exists.', 409);
    ensure(
      existing.members.length < 31 ||
        existing.members.some((id) => String(id) === String(user._id)),
      'This group is full.',
      409,
    );
  }
  const claimed = await GroupInvitation.findOneAndDelete({
    _id: invitation._id,
    to: user._id,
    expiresAt: { $gt: new Date() },
  });
  ensure(claimed, 'Invitation has already been answered or cancelled.', 409);
  let group;
  if (action === 'accept') {
    group = await Conversation.findOneAndUpdate(
      {
        _id: invitation.group,
        kind: 'group',
        $expr: {
          $lte: [
            { $size: { $setUnion: ['$members', [new mongoose.Types.ObjectId(user._id)]] } },
            31,
          ],
        },
      },
      { $addToSet: { members: user._id } },
      { new: true },
    );
    if (!group) {
      await GroupInvitation.updateOne(
        { group: claimed.group, to: claimed.to },
        { $setOnInsert: { from: claimed.from, expiresAt: claimed.expiresAt } },
        { upsert: true },
      );
      ensure(false, 'The group is full or no longer exists.', 409);
    }
    notifyMembers(group.members, 'conversations:updated', {});
  }
  await GroupInvitation.deleteOne({ _id: invitation._id, to: user._id });
  notifyMembers([user._id, invitation.from, ...(group?.members || [])], 'groups:invitations', {});
  return json({ ok: true, groupId: action === 'accept' ? String(group._id) : undefined });
}
