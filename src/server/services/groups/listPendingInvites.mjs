import { GroupInvitation } from '@/lib/models.mjs';
import { json } from '@/server/http.mjs';
import { publicUser } from '@/lib/auth.mjs';
import { requireGroupManager } from './requireGroupManager.mjs';
export async function listPendingInvites(request, { user, id }) {
  await requireGroupManager(id, user._id);
  const invitations = await GroupInvitation.find({ group: id, expiresAt: { $gt: new Date() } })
    .populate('to from')
    .lean();
  return json({
    invitations: invitations.map((invite) => ({
      id: String(invite._id),
      user: publicUser(invite.to),
      invitedBy: publicUser(invite.from),
      expiresAt: invite.expiresAt,
    })),
  });
}
