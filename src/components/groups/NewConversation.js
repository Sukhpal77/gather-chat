'use client';
import { useState } from 'react';
import { Search, ArrowRight, Users, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { api } from '@/lib/client-api';

export default function NewConversation({
  friends,
  initialGroup,
  onClose,
  onCreated,
  onFindPeople,
}) {
  const [group, setGroup] = useState(!!initialGroup);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const accepted = friends.filter(
    (f) => f.status === 'accepted' && f.user.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function create(userId) {
    setBusy(true);
    setError('');
    try {
      const data = await api('/conversations', {
        method: 'POST',
        body: group
          ? { kind: 'group', name, description, memberIds: members }
          : { kind: 'direct', userId },
      });
      await onCreated(data.id);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={group ? 'Make a new circle' : 'Start a conversation'}
      description="Good conversations start with your people."
      onClose={onClose}
    >
      <div className="modal-body">
        <div className="auth-tabs">
          <button className={!group ? 'active' : ''} onClick={() => setGroup(false)}>
            Direct message
          </button>
          <button className={group ? 'active' : ''} onClick={() => setGroup(true)}>
            Group chat
          </button>
        </div>
        {group && (
          <>
            <label>
              Group name
              <input
                placeholder="Give your circle a name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Description <span className="optional">optional</span>
              <input
                placeholder="What brings you together?"
                maxLength={240}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </>
        )}
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search friends"
            placeholder="Find a friend"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="modal-people">
          {accepted.map((friend) => (
            <button
              className={`choose-person ${members.includes(friend.user.id) ? 'chosen' : ''}`}
              disabled={busy}
              key={friend.id}
              onClick={() =>
                group
                  ? setMembers((previous) =>
                      previous.includes(friend.user.id)
                        ? previous.filter((id) => id !== friend.user.id)
                        : [...previous, friend.user.id],
                    )
                  : create(friend.user.id)
              }
            >
              <Avatar person={friend.user} size="small" />
              <span>
                {friend.user.name}
                <small>@{friend.user.username}</small>
              </span>
              {group ? (
                <i className="checkbox-indicator">
                  {members.includes(friend.user.id) && <Check size={14} />}
                </i>
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          ))}
          {!accepted.length && (
            <div className="small-empty">
              No friends found.
              <button
                className="text-button"
                onClick={() => {
                  onClose();
                  onFindPeople();
                }}
              >
                Find people first →
              </button>
            </div>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {group && (
          <button
            className="primary-button full-width"
            disabled={busy || !name.trim() || !members.length}
            onClick={() => create()}
          >
            <Users size={17} />
            {busy
              ? 'Creating…'
              : `Create group${members.length ? ` · ${members.length + 1} people` : ''}`}
          </button>
        )}
      </div>
    </Modal>
  );
}
