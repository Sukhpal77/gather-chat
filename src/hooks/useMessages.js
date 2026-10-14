'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client-api';

export function useMessages(selectedId, reportError) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const olderRequest = useRef(false);
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const generation = useRef(0);
  const markRead = useCallback(
    async (id, messageId) => {
      if (!messageId || selected.current !== id || document.visibilityState !== 'visible') return;
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
        // Keep messages received while this fetch was running, but discard the
        // old page on reconnect. Retaining a distant page can hide a missing gap.
        const oldest = data.messages[0];
        const retained = oldest
          ? previous.filter(
              (message) =>
                new Date(message.createdAt) > new Date(oldest.createdAt) ||
                (new Date(message.createdAt).getTime() === new Date(oldest.createdAt).getTime() &&
                  message.id >= oldest.id),
            )
          : [];
        const merged = new Map(retained.map((message) => [message.id, message]));
        for (const message of data.messages) {
          const existing = merged.get(message.id);
          merged.set(message.id, {
            ...message,
            readBy: [...new Set([...message.readBy, ...(existing?.readBy || [])])],
          });
        }
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
    olderRequest.current = false;
    setLoadingOlder(false);
    reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  async function loadOlder() {
    if (!messages.length || olderRequest.current || !hasMore) return;
    olderRequest.current = true;
    setLoadingOlder(true);
    const id = selectedId;
    const version = generation.current;
    try {
      const data = await api(`/conversations/${id}/messages?before=${messages[0].id}`);
      if (selected.current === id && generation.current === version) {
        setMessages((previous) => {
          const merged = new Map(
            [...data.messages, ...previous].map((message) => [message.id, message]),
          );
          return [...merged.values()].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id),
          );
        });
        setHasMore(data.hasMore);
      }
    } catch (error) {
      reportError(error.message);
    } finally {
      if (generation.current === version) {
        olderRequest.current = false;
        setLoadingOlder(false);
      }
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
  return { messages, loading, hasMore, loadingOlder, loadOlder, receive, read, reload };
}
