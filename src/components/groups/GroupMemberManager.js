import { UserMinus, Crown, ShieldCheck, ShieldMinus } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
export default function GroupMemberManager({ group, user, busy, onConfirm }) {
  const owner = user.id === group.ownerId;
  const manager = owner || group.adminIds?.includes(user.id);
  return (
    <div className="group-member-manager">
      {group.members.map((member) => (
        <div className="member-row" key={member.id}>
          <Avatar person={member} size="small" />
          <span>
            {member.name}
            <small>
              {member.id === group.ownerId
                ? 'Owner'
                : group.adminIds?.includes(member.id)
                  ? 'Admin'
                  : member.id === user.id
                    ? 'You'
                    : `@${member.username}`}
            </small>
          </span>
          {manager &&
            member.id !== group.ownerId &&
            member.id !== user.id &&
            (owner || !group.adminIds?.includes(member.id)) && (
              <div className="member-controls">
                {owner && (
                  <>
                    <button
                      className="icon-button"
                      disabled={busy}
                      aria-label={`${group.adminIds?.includes(member.id) ? 'Remove admin role from' : 'Make admin'} ${member.name}`}
                      title={
                        group.adminIds?.includes(member.id) ? 'Remove admin role' : 'Make admin'
                      }
                      onClick={() =>
                        onConfirm({
                          action: group.adminIds?.includes(member.id) ? 'demote' : 'promote',
                          member,
                          title: group.adminIds?.includes(member.id)
                            ? 'Remove admin role?'
                            : 'Make this member an admin?',
                          description: group.adminIds?.includes(member.id)
                            ? `${member.name} will remain a member.`
                            : `${member.name} can edit this group, invite friends, and manage ordinary members.`,
                        })
                      }
                    >
                      {group.adminIds?.includes(member.id) ? (
                        <ShieldMinus size={16} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                    </button>
                    <button
                      className="icon-button"
                      disabled={busy}
                      aria-label={`Make ${member.name} group owner`}
                      title="Transfer ownership"
                      onClick={() =>
                        onConfirm({
                          action: 'transfer',
                          member,
                          title: 'Transfer group ownership?',
                          description: `${member.name} will manage the group. You’ll remain a member.`,
                        })
                      }
                    >
                      <Crown size={16} />
                    </button>
                  </>
                )}
                <button
                  className="icon-button"
                  disabled={busy}
                  aria-label={`Remove ${member.name} from group`}
                  title="Remove member"
                  onClick={() =>
                    onConfirm({
                      action: 'remove',
                      member,
                      title: 'Remove this member?',
                      description: `${member.name} will lose access to this group and its shared files.`,
                    })
                  }
                >
                  <UserMinus size={16} />
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
