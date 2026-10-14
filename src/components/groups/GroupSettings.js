'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import GroupEditor from './GroupEditor';
import AddGroupMembers from './AddGroupMembers';
import GroupMemberManager from './GroupMemberManager';
import GroupPendingInvites from './GroupPendingInvites';
import { useGroupActions } from '@/hooks/useGroupActions';
export default function GroupSettings({
  group,
  user,
  friends,
  onUpdated,
  onClose,
  invitationsVersion,
}) {
  const [tab, setTab] = useState('details');
  const [confirmation, setConfirmation] = useState(null);
  const actions = useGroupActions(group.id, onUpdated);
  const owner = group.ownerId === user.id;
  const manager = owner || group.adminIds?.includes(user.id);
  async function confirm() {
    const ok = await actions[confirmation.action](confirmation.member.id);
    if (ok) {
      setConfirmation(null);
      if (confirmation.action === 'transfer') onClose();
    }
  }
  return (
    <Modal
      title="Manage your group"
      description={
        manager
          ? 'A little care for your circle.'
          : 'Only owners and admins can change group details and membership.'
      }
      onClose={() => {
        if (!actions.busy) onClose();
      }}
    >
      <div className="modal-body">
        {confirmation ? (
          <div className="group-confirm">
            <h3>{confirmation.title}</h3>
            <p>{confirmation.description}</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                disabled={actions.busy}
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button className="danger-button" disabled={actions.busy} onClick={confirm}>
                {actions.busy
                  ? 'Updating…'
                  : confirmation.action === 'transfer'
                    ? 'Transfer ownership'
                    : confirmation.action === 'promote'
                      ? 'Make admin'
                      : confirmation.action === 'demote'
                        ? 'Remove admin role'
                        : 'Remove member'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={tab === 'details' ? 'active' : ''}
                onClick={() => setTab('details')}
              >
                Details
              </button>
              <button
                className={tab === 'members' ? 'active' : ''}
                onClick={() => setTab('members')}
              >
                Members · {group.members.length}
              </button>
              {manager && (
                <button
                  className={tab === 'invites' ? 'active' : ''}
                  onClick={() => setTab('invites')}
                >
                  Invitations
                </button>
              )}
            </div>
            {tab === 'details' ? (
              manager ? (
                <GroupEditor group={group} actions={actions} />
              ) : (
                <div className="small-empty">
                  <h3>{group.name}</h3>
                  <p>{group.description || 'No description yet.'}</p>
                </div>
              )
            ) : tab === 'invites' ? (
              <GroupPendingInvites
                group={group}
                actions={actions}
                refreshKey={invitationsVersion}
              />
            ) : (
              <>
                <GroupMemberManager
                  group={group}
                  user={user}
                  busy={actions.busy}
                  onConfirm={setConfirmation}
                />
                {manager && <AddGroupMembers group={group} friends={friends} actions={actions} />}
              </>
            )}
          </>
        )}
        {actions.error && (
          <p className="form-error" role="alert">
            {actions.error}
          </p>
        )}
        {actions.notice && (
          <p className="form-success" role="status">
            {actions.notice}
          </p>
        )}
      </div>
    </Modal>
  );
}
