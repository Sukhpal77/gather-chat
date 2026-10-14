import { GroupInvitation } from '@/lib/models.mjs';
import { json } from '@/server/http.mjs';
import { publicUser } from '@/lib/auth.mjs';
export async function listMyInvitations(request, { user }) {
  const invitations = await GroupInvitation.find({ to: user._id, expiresAt: { $gt: new Date() } })
    .populate('group from')
    .lean();
  return json({
    invitations: invitations
      .filter(
        (invite) =>
          invite.group &&
          invite.from &&
          !invite.group.members.some((id) => String(id) === String(user._id)),
      )
      .map((invite) => ({
        id: String(invite._id),
        group: {
          id: String(invite.group._id),
          name: invite.group.name,
          description: invite.group.description,
          avatar: invite.group.avatar,
        },
        invitedBy: publicUser(invite.from),
        expiresAt: invite.expiresAt,
      })),
  });
}
