'use client';
import { useState } from 'react';
import { api } from '@/lib/client-api';
export function useGroupActions(groupId, onUpdated) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function run(path, method, body, notice) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(`/groups/${groupId}${path}`, { method, body });
      await onUpdated();
      setNotice(notice);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    notice,
    setError,
    update: (body) => run('', 'PATCH', body, 'Group details saved.'),
    add: (memberIds) => run('/members', 'POST', { memberIds }, 'Friends added to the group.'),
    remove: (id) => run(`/members/${id}`, 'DELETE', {}, 'Member removed.'),
    transfer: (userId) => run('/owner', 'POST', { userId }, 'Group ownership transferred.'),
    promote: (id) => run(`/members/${id}/role`, 'PATCH', { role: 'admin' }, 'Group admin added.'),
    demote: (id) =>
      run(`/members/${id}/role`, 'PATCH', { role: 'member' }, 'Admin returned to member role.'),
    invite: (memberIds) =>
      run(
        '/invites',
        'POST',
        { memberIds },
        'Invitations sent. Your friends can accept from Groups.',
      ),
    cancelInvite: (id) => run(`/invites/${id}`, 'DELETE', {}, 'Invitation cancelled.'),
  };
}
