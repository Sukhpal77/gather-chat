'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useRealtime(user, callbacks) {
  const socket = useRef(null);
  const handlers = useRef(callbacks);
  handlers.current = callbacks;
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState([]);
  const [typing, setTyping] = useState({});
  useEffect(() => {
    if (!user) return;
    const connection = io({ withCredentials: true, reconnectionDelayMax: 4000 });
    socket.current = connection;
    connection.on('connect', () => {
      setConnected(true);
      handlers.current.onReconnect?.();
    });
    connection.on('disconnect', () => {
      setConnected(false);
      setOnline([]);
    });
    connection.on('presence:update', setOnline);
    connection.on('presence:change', ({ userId, online }) =>
      setOnline((previous) =>
        online ? [...new Set([...previous, userId])] : previous.filter((id) => id !== userId),
      ),
    );
    connection.on('message:new', (message) => handlers.current.onMessage?.(message));
    connection.on('messages:read', (event) => handlers.current.onRead?.(event));
    connection.on('friends:updated', () => handlers.current.onFriends?.());
    connection.on('groups:invitations', () => handlers.current.onInvitations?.());
    connection.on('conversations:updated', () => {
      handlers.current.onConversations?.();
      connection.emit('presence:refresh');
    });
    connection.on('typing', ({ conversationId, userId, active }) =>
      setTyping((previous) => ({
        ...previous,
        [conversationId]: { ...previous[conversationId], [userId]: active ? Date.now() : 0 },
      })),
    );
    const expiry = setInterval(
      () =>
        setTyping((previous) => {
          const next = {};
          for (const [id, users] of Object.entries(previous))
            next[id] = Object.fromEntries(
              Object.entries(users).filter(([, time]) => time > Date.now() - 4000),
            );
          return next;
        }),
      1000,
    );
    return () => {
      clearInterval(expiry);
      connection.disconnect();
      socket.current = null;
    };
  }, [user?.id]);
  return { socket, connected, online, typing };
}
