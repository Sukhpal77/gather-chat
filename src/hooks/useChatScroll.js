'use client';
import { useLayoutEffect, useRef } from 'react';

export function useChatScroll(messages, userId) {
  const scrollRef = useRef(null);
  const previous = useRef(null);
  function remember() {
    const node = scrollRef.current;
    if (node && previous.current)
      Object.assign(previous.current, {
        height: node.scrollHeight,
        top: node.scrollTop,
        nearBottom: node.scrollHeight - node.scrollTop - node.clientHeight < 120,
      });
  }
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || !messages.length) {
      previous.current = null;
      return;
    }
    const first = messages[0].id;
    const last = messages.at(-1);
    const old = previous.current;
    if (old && old.last === last.id && old.first !== first) {
      node.scrollTop = old.top + node.scrollHeight - old.height;
    } else if (!old || (old.last !== last.id && (old.nearBottom || last.sender.id === userId))) {
      node.scrollTop = node.scrollHeight;
    }
    previous.current = { first, last: last.id };
    remember();
  }, [messages, userId]);
  return { scrollRef, onScroll: remember };
}
