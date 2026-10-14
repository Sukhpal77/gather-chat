import { GroupInvitation } from '@/lib/models.mjs';
import { json } from '@/server/http.mjs';
import { ensure, objectId } from '@/lib/validation.mjs';
import { notifyMembers } from '@/lib/chat.mjs';
import { requireGroupManager } from './requireGroupManager.mjs';
export async function cancelInvite(request, { user, id, invitationId }) {
  const group = await requireGroupManager(id, user._id);
  const invitation = await GroupInvitation.findOneAndDelete({
    _id: objectId(invitationId),
    group: id,
  });
  ensure(invitation, 'Invitation not found.', 404);
  notifyMembers([...group.members, invitation.to], 'groups:invitations', {});
  return json({ ok: true });
}
