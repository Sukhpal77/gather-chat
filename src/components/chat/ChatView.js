'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, Info, Pin, Archive, X, Hash } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import { dayLabel } from '@/lib/format';

export default function ChatView({
  conversation,
  user,
  messagesState,
  realtime,
  reportError,
  onBack,
  onInfo,
  onFlag,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const end = useRef(null);
  const lastCount = useRef(0);
  useEffect(() => {
    if (messagesState.messages.length >= lastCount.current)
      end.current?.scrollIntoView({ behavior: 'smooth' });
    lastCount.current = messagesState.messages.length;
  }, [messagesState.messages]);
  if (!conversation)
    return (
      <section className="chat-view welcome-view">
        <div className="welcome-orbit">
          <span>✳</span>
        </div>
        <span className="eyebrow">A SPACE FOR YOUR PEOPLE</span>
        <h2>
          Good things start
          <br />
          with a <em>hello.</em>
        </h2>
        <p>
          Choose a conversation, or make a new connection.
          <br />
          Your people are closer than you think.
        </p>
        <div className="welcome-note">Less scrolling. More talking.</div>
      </section>
    );
  const person =
    conversation.kind === 'group'
      ? { name: conversation.name, avatar: conversation.avatar }
      : conversation.members.find((m) => m.id !== user.id);
  const online = realtime.online.includes(person?.id);
  const typingUsers = Object.keys(realtime.typing[conversation.id] || {}).filter(
    (id) => id !== user.id,
  );
  const visible = messagesState.messages.filter(
    (message) =>
      !search ||
      message.text.toLowerCase().includes(search.toLowerCase()) ||
      message.attachment?.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="chat-view">
      <header className="chat-header">
        <button
          className="icon-button mobile-back"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar
          person={person}
          group={conversation.kind === 'group'}
          online={conversation.kind === 'direct' ? online : undefined}
        />
        <button className="chat-person" onClick={onInfo}>
          <h2>
            {conversation.name}
            {conversation.kind === 'group' && <Hash size={14} />}
          </h2>
          <span>
            {conversation.kind === 'group'
              ? `${conversation.members.length} people in this circle`
              : online
                ? 'Online · Here for a conversation'
                : 'Offline · Leave a little hello'}
          </span>
        </button>
        <div className="chat-header-actions">
          <button
            className={`icon-button ${searchOpen ? 'active' : ''}`}
            aria-label="Search messages"
            onClick={() => {
              setSearchOpen(!searchOpen);
              setSearch('');
            }}
          >
            <Search size={20} />
          </button>
          <button
            className={`icon-button ${conversation.pinned ? 'active' : ''}`}
            aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
            onClick={() => onFlag('pinned', !conversation.pinned)}
          >
            <Pin size={19} />
          </button>
          <button
            className="icon-button"
            aria-label={conversation.archived ? 'Restore conversation' : 'Archive conversation'}
            onClick={() => onFlag('archived', !conversation.archived)}
          >
            <Archive size={19} />
          </button>
          <span className="header-divider" />
          <button className="icon-button" aria-label="Conversation details" onClick={onInfo}>
            <Info size={20} />
          </button>
        </div>
      </header>
      {searchOpen && (
        <label className="message-search search-box">
          <Search size={16} />
          <input
            autoFocus
            placeholder="Search this conversation"
            aria-label="Search message text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="icon-button"
            onClick={() => {
              setSearchOpen(false);
              setSearch('');
            }}
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </label>
      )}
      <div className="message-scroll" aria-label="Conversation messages" aria-live="polite">
        {messagesState.hasMore && (
          <button className="load-older" onClick={messagesState.loadOlder}>
            Load earlier messages
          </button>
        )}
        {messagesState.loading ? (
          <div className="small-empty">Loading your conversation…</div>
        ) : !visible.length ? (
          <EmptyState
            title={search ? 'No matching messages' : 'The beginning of something good'}
            description={
              search
                ? 'Try another word or load earlier messages.'
                : 'Send a hello to get this conversation started.'
            }
          />
        ) : (
          visible.map((message, index) => (
            <div key={message.id}>
              {(index === 0 ||
                new Date(visible[index - 1].createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString()) && (
                <div className="date-divider">
                  <span>{dayLabel(message.createdAt)}</span>
                </div>
              )}
              <MessageBubble
                message={message}
                own={message.sender.id === user.id}
                group={conversation.kind === 'group'}
              />
            </div>
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>
              <i />
              <i />
              <i />
            </span>
            {conversation.kind === 'group' ? 'Someone is' : conversation.name.split(' ')[0] + ' is'}{' '}
            typing…
          </div>
        )}
        <div ref={end} />
      </div>
      <Composer
        key={conversation.id}
        conversationId={conversation.id}
        socket={realtime.socket}
        connected={realtime.connected}
        onSent={messagesState.receive}
        reportError={reportError}
      />
    </section>
  );
}
