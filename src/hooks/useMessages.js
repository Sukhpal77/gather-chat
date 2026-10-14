'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client-api';

export function useMessages(selectedId, reportError) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const generation = useRef(0);
  const markRead = useCallback(
    async (id, messageId) => {
      if (!messageId) return;
      try {
        await api(`/conversations/${id}/read`, { method: 'POST', body: { messageId } });
      } catch (error) {
        if (error.status !== 403 && error.status !== 404) reportError(error.message);
      }
    },
    [reportError],
  );
  const reload = useCallback(async () => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const version = ++generation.current;
    setLoading(true);
    try {
      const data = await api(`/conversations/${selectedId}/messages`);
      if (version !== generation.current || selected.current !== selectedId) return;
      setMessages((previous) => {
        const merged = new Map(
          [...data.messages, ...previous].map((message) => [message.id, message]),
        );
        return [...merged.values()].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id),
        );
      });
      setHasMore(data.hasMore);
      await markRead(selectedId, data.messages.at(-1)?.id);
    } catch (error) {
      if (version === generation.current) reportError(error.message);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [selectedId, markRead, reportError]);
  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  async function loadOlder() {
    if (!messages.length) return;
    const id = selectedId;
    try {
      const data = await api(`/conversations/${id}/messages?before=${messages[0].id}`);
      if (selected.current === id) {
        setMessages((previous) => [...data.messages, ...previous]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      reportError(error.message);
    }
  }
  const receive = useCallback(
    (message) => {
      if (selected.current !== message.conversationId) return;
      setMessages((previous) =>
        previous.some((item) => item.id === message.id) ? previous : [...previous, message],
      );
      if (document.visibilityState === 'visible') markRead(message.conversationId, message.id);
    },
    [markRead],
  );
  const read = useCallback(({ conversationId, userId, messageId, createdAt }) => {
    if (selected.current === conversationId)
      setMessages((previous) =>
        previous.map((message) =>
          new Date(message.createdAt) < new Date(createdAt) ||
          (new Date(message.createdAt).getTime() === new Date(createdAt).getTime() &&
            message.id <= messageId)
            ? { ...message, readBy: [...new Set([...message.readBy, userId])] }
            : message,
        ),
      );
  }, []);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === 'visible' && selectedId && messages.length)
        markRead(selectedId, messages.at(-1).id);
    };
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [selectedId, messages, markRead]);
  return { messages, loading, hasMore, loadOlder, receive, read, reload };
}
