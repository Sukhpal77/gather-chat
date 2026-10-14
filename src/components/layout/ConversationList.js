'use client';
import { useState } from 'react';
import { Search, SquarePen, Pin, MessageCircle, ChevronDown } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { recentTime } from '@/lib/format';

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
  online,
  user,
  archived,
  loading,
  connected,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const visible = conversations.filter(
    (c) =>
      c.archived === !!archived &&
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter !== 'unread' || c.unread > 0),
  );
  const pinned = visible.filter((c) => c.pinned);
  const rest = visible.filter((c) => !c.pinned);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
  function rows(items) {
    return items.map((c) => {
      const person =
        c.kind === 'group'
          ? { name: c.name, avatar: c.avatar }
          : c.members.find((m) => m.id !== user.id);
      return (
        <button
          className={`conversation-row ${selectedId === c.id ? 'selected' : ''}`}
          onClick={() => onSelect(c.id)}
          key={c.id}
        >
          <Avatar
            person={person}
            group={c.kind === 'group'}
            online={c.kind === 'direct' ? online.includes(person?.id) : undefined}
          />
          <span className="conversation-copy">
            <span className="conversation-title">{c.name}</span>
            <span className={`conversation-preview ${c.unread ? 'unread' : ''}`}>
              {c.lastMessage ||
                (c.kind === 'group'
                  ? `${c.members.length} members · Say hello`
                  : 'Start a conversation')}
            </span>
          </span>
          <span className="conversation-meta">
            <time>{recentTime(c.lastMessageAt)}</time>
            {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
            {c.pinned && !c.unread && <Pin size={12} />}
          </span>
        </button>
      );
    });
  }
  return (
    <aside className="conversation-sidebar">
      <div className="sidebar-heading">
        <div className="heading-line">
          <h1>
            {archived ? 'Archived' : 'Messages'}
            <span className="count-pill">{archived ? visible.length : totalUnread}</span>
          </h1>
          <button
            className="icon-button compose-button"
            onClick={onNew}
            aria-label="New conversation"
          >
            <SquarePen size={19} />
          </button>
        </div>
        <p>A little closer to your people.</p>
      </div>
      <label className="search-box">
        <Search size={17} />
        <input
          aria-label="Search conversations"
          placeholder="Search conversations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd>⌕</kbd>
      </label>
      <div className="list-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All messages
        </button>
        <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
          Unread{totalUnread > 0 && <span>{totalUnread}</span>}
        </button>
      </div>
      <div className="conversation-scroll">
        {loading ? (
          <p className="small-empty">Loading conversations…</p>
        ) : !visible.length ? (
          <div className="sidebar-empty">
            <MessageCircle size={28} />
            <strong>
              {search
                ? 'No conversations found'
                : archived
                  ? 'All caught up'
                  : 'Your next hello starts here'}
            </strong>
            <p>
              {search
                ? 'Try another name.'
                : archived
                  ? 'Archived chats will appear here.'
                  : 'Add a friend and start talking.'}
            </p>
            {!archived && (
              <button className="text-button" onClick={onNew}>
                New conversation →
              </button>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <div className="list-section-label">
                  <Pin size={12} /> PINNED <span>{pinned.length}</span>
                </div>
                {rows(pinned)}
              </>
            )}
            <div className="list-section-label">
              {pinned.length ? 'ALL CONVERSATIONS' : 'YOUR CONVERSATIONS'}
              <ChevronDown size={12} />
            </div>
            {rows(rest)}
          </>
        )}
      </div>
      <div className="sidebar-footer">
        <span className={`tiny-dot ${connected ? '' : 'offline'}`} />
        <span>{connected ? 'Connected. Ready for a hello.' : 'Reconnecting to live chat…'}</span>
        <span className="footer-flower">✳</span>
      </div>
    </aside>
  );
}
