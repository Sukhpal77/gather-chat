'use client';
import { useEffect, useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { api } from '@/lib/client-api';
export default function GroupPendingInvites({ group, actions, refreshKey }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(`/groups/${group.id}/invites`, { signal: controller.signal })
      .then((data) => setInvitations(data.invitations))
      .catch((error) => {
        if (error.name !== 'AbortError') actions.setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [group.id, actions.notice, refreshKey]);
  return (
    <div>
      {loading ? (
        <p className="small-empty">Loading invitations…</p>
      ) : !invitations.length ? (
        <p className="small-empty">No pending invitations. Invite friends from the Members tab.</p>
      ) : (
        invitations.map((invite) => (
          <div className="member-row" key={invite.id}>
            <Avatar person={invite.user} size="small" />
            <span>
              {invite.user.name}
              <small>Invited by {invite.invitedBy.name}</small>
            </span>
            <button
              className="text-button"
              disabled={actions.busy}
              onClick={() => actions.cancelInvite(invite.id)}
            >
              Cancel invitation
            </button>
          </div>
        ))
      )}
    </div>
  );
}
