'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client-api';
export function useGroupInvitations(reportError) {
  const [invitations, setInvitations] = useState([]);
  const [busy, setBusy] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const data = await api('/group-invitations');
      setInvitations(data.invitations);
      setVersion((previous) => previous + 1);
    } catch (error) {
      reportError(error.message);
    }
  }, [reportError]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  async function respond(id, action, onJoined) {
    setBusy(id);
    try {
      const data = await api(`/group-invitations/${id}`, { method: 'POST', body: { action } });
      await refresh();
      if (data.groupId) await onJoined(data.groupId);
    } catch (error) {
      reportError(error.message);
    } finally {
      setBusy('');
    }
  }
  return { invitations, busy, version, refresh, respond };
}
