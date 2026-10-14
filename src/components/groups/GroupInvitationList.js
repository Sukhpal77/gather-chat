import { Check, X, Mail } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
export default function GroupInvitationList({ invitations, busy, onRespond }) {
  if (!invitations.length) return null;
  return (
    <div className="group-incoming-invitations">
      <div className="section-title">
        <h2>
          <Mail size={17} /> Group invitations{' '}
          <span className="count-pill">{invitations.length}</span>
        </h2>
      </div>
      <div className="friend-list">
        {invitations.map((invite) => (
          <article className="friend-row" key={invite.id}>
            <Avatar person={invite.group} group />
            <div>
              <h3>{invite.group.name}</h3>
              <p>
                {invite.invitedBy.name} invited you to join · expires{' '}
                {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <div className="friend-actions">
              <button
                className="primary-button"
                disabled={!!busy}
                onClick={() => onRespond(invite.id, 'accept')}
              >
                <Check size={16} />
                Accept invitation
              </button>
              <button
                className="secondary-button"
                disabled={!!busy}
                onClick={() => onRespond(invite.id, 'decline')}
              >
                <X size={16} />
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
