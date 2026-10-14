'use client';
import { useState } from 'react';
import { Search, Check, UserPlus } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
export default function AddGroupMembers({ group, friends, actions }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const eligible = friends.filter(
    (friend) =>
      friend.status === 'accepted' &&
      !group.members.some((member) => member.id === friend.user.id) &&
      friend.user.name.toLowerCase().includes(search.toLowerCase()),
  );
  async function add(invite = false) {
    if (await actions[invite ? 'invite' : 'add'](selected)) setSelected([]);
  }
  return (
    <div className="group-add-members">
      <h3>Add friends to your circle</h3>
      <p>Only accepted friends can be added. Up to 31 people per group.</p>
      <label className="search-box">
        <Search size={16} />
        <input
          aria-label="Search friends to add"
          placeholder="Find a friend"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="modal-people">
        {eligible.map((friend) => (
          <button
            key={friend.id}
            className={`choose-person ${selected.includes(friend.user.id) ? 'chosen' : ''}`}
            disabled={actions.busy}
            onClick={() =>
              setSelected((previous) =>
                previous.includes(friend.user.id)
                  ? previous.filter((id) => id !== friend.user.id)
                  : [...previous, friend.user.id],
              )
            }
          >
            <Avatar person={friend.user} size="small" />
            <span>
              {friend.user.name}
              <small>@{friend.user.username}</small>
            </span>
            <i className="checkbox-indicator">
              {selected.includes(friend.user.id) && <Check size={14} />}
            </i>
          </button>
        ))}
        {!eligible.length && (
          <p className="small-empty">
            No other friends to add. Accept new friends in the Friends screen.
          </p>
        )}
      </div>
      <button
        className="primary-button full-width"
        disabled={actions.busy || !selected.length || selected.length + group.members.length > 31}
        onClick={() => add()}
      >
        <UserPlus size={16} />
        Add selected friends{selected.length > 0 && ` · ${selected.length}`}
      </button>
      <button
        className="secondary-button full-width group-invite-button"
        disabled={actions.busy || !selected.length}
        onClick={() => add(true)}
      >
        Invite selected friends instead
      </button>
    </div>
  );
}
