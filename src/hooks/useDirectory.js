'use client';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/client-api';

export function useDirectory(user, reportError) {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshConversations = useCallback(async () => {
    const data = await api('/conversations');
    setConversations(data.conversations);
  }, []);
  const refreshFriends = useCallback(async () => {
    const data = await api('/friends');
    setFriends(data.friends);
  }, []);
  const refresh = useCallback(async () => {
    try {
      await Promise.all([refreshConversations(), refreshFriends()]);
    } catch (error) {
      reportError(error.message);
    } finally {
      setLoading(false);
    }
  }, [refreshConversations, refreshFriends, reportError]);
  useEffect(() => {
    if (user) refresh();
  }, [user?.id, refresh]);
  return { conversations, friends, loading, refresh, refreshConversations, refreshFriends };
}
