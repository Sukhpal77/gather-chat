'use client';
import { useEffect, useState } from 'react';
import { Search, UserPlus, Users, Check, X, MessageCircle, Ban, UserMinus } from 'lucide-react';
import { api } from '@/lib/client-api';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

export default function FriendsView({ friends, refresh, onChat, reportError }) {
  const [tab, setTab] = useState('friends');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState('');
  const incoming = friends.filter((f) => f.status === 'pending' && f.incoming);
  useEffect(() => {
    if (tab !== 'discover') return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      api(`/people?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((data) => setPeople(data.people))
        .catch((error) => {
          if (error.name !== 'AbortError') reportError(error.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tab, query, friends, reportError]);
  async function action(id, kind) {
    setBusy(id);
    try {
      if (kind === 'request') await api('/friends', { method: 'POST', body: { userId: id } });
      else
        await api(`/friends/${id}`, {
          method: ['remove', 'decline', 'unblock'].includes(kind) ? 'DELETE' : 'PATCH',
          body: { action: kind },
        });
      await refresh();
    } catch (error) {
      reportError(error.message);
    } finally {
      setBusy('');
    }
  }
  const shown = friends
    .filter((f) =>
      tab === 'requests'
        ? f.status === 'pending'
        : tab === 'blocked'
          ? f.status === 'blocked' && f.blockedByMe
          : f.status === 'accepted',
    )
    .filter(
      (f) =>
        f.user.name.toLowerCase().includes(query.toLowerCase()) ||
        f.user.username.includes(query.toLowerCase()),
    );
  return (
    <section className="feature-view">
      <header className="feature-header">
        <span className="eyebrow">YOUR PEOPLE</span>
        <h1>
          A good circle makes
          <br />
          all the difference<span>.</span>
        </h1>
        <p>Find familiar faces. Make room for new ones.</p>
        <button className="primary-button" onClick={() => setTab('discover')}>
          <UserPlus size={18} /> Find people
        </button>
      </header>
      <div className="feature-toolbar">
        <div className="feature-tabs">
          {[
            ['friends', 'Friends'],
            ['requests', 'Requests'],
            ['discover', 'Find people'],
            ['blocked', 'Blocked'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id);
                setQuery('');
              }}
            >
              {label}
              {id === 'requests' && incoming.length > 0 && (
                <span className="count-pill">{incoming.length}</span>
              )}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search people"
            placeholder="Search name or username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {tab === 'discover' ? (
        searching ? (
          <p className="small-empty">Finding your people…</p>
        ) : (
          <div className="people-grid">
            {people.map((person) => (
              <article className="person-card" key={person.id}>
                <Avatar person={person} size="large" />
                <h3>{person.name}</h3>
                <span>@{person.username}</span>
                <p>{person.bio || 'A new connection waiting to happen.'}</p>
                {!person.relationship ? (
                  <button
                    className="secondary-button"
                    disabled={busy === person.id}
                    onClick={() => action(person.id, 'request')}
                  >
                    <UserPlus size={16} /> Add friend
                  </button>
                ) : person.relationship.status === 'accepted' ? (
                  <button className="secondary-button" onClick={() => onChat(person.id)}>
                    <MessageCircle size={16} /> Message
                  </button>
                ) : person.relationship.status === 'pending' && person.relationship.incoming ? (
                  <button
                    className="primary-button"
                    disabled={!!busy}
                    onClick={() => action(person.relationship.id, 'accept')}
                  >
                    Accept request
                  </button>
                ) : (
                  <span className="relationship-label">
                    {person.relationship.status === 'blocked' ? 'Unavailable' : 'Request sent'}
                  </span>
                )}
              </article>
            ))}
            {!people.length && (
              <EmptyState
                title="No people found"
                description="Try another name, or invite someone to create an account."
                icon={Users}
              />
            )}
          </div>
        )
      ) : !shown.length ? (
        <EmptyState
          title={
            tab === 'requests'
              ? 'No requests right now'
              : tab === 'blocked'
                ? 'No blocked people'
                : 'Your circle starts with one hello'
          }
          description={
            tab === 'friends'
              ? 'Find someone you know and send a friend request.'
              : 'Everything is up to date.'
          }
          icon={Users}
          action={
            tab === 'friends' && (
              <button className="primary-button" onClick={() => setTab('discover')}>
                Find people <UserPlus size={16} />
              </button>
            )
          }
        />
      ) : (
        <div className="friend-list">
          {shown.map((friend) => (
            <article className="friend-row" key={friend.id}>
              <Avatar person={friend.user} />
              <div>
                <h3>
                  {friend.user.name}
                  <span>@{friend.user.username}</span>
                </h3>
                <p>
                  {friend.status === 'pending'
                    ? friend.incoming
                      ? 'Would like to join your circle'
                      : 'Your friend request is pending'
                    : friend.user.bio || friend.user.status}
                </p>
              </div>
              <div className="friend-actions">
                {friend.status === 'accepted' ? (
                  <>
                    <button className="secondary-button" onClick={() => onChat(friend.user.id)}>
                      <MessageCircle size={16} /> Message
                    </button>
                    <button
                      className="icon-button"
                      title="Remove friend"
                      aria-label={`Remove ${friend.user.name}`}
                      onClick={() => action(friend.id, 'remove')}
                      disabled={!!busy}
                    >
                      <UserMinus size={18} />
                    </button>
                    <button
                      className="icon-button"
                      title="Block person"
                      aria-label={`Block ${friend.user.name}`}
                      onClick={() => action(friend.id, 'block')}
                      disabled={!!busy}
                    >
                      <Ban size={18} />
                    </button>
                  </>
                ) : friend.status === 'pending' ? (
                  <>
                    {friend.incoming && (
                      <button
                        className="primary-button"
                        onClick={() => action(friend.id, 'accept')}
                        disabled={!!busy}
                      >
                        <Check size={16} /> Accept
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      onClick={() => action(friend.id, 'decline')}
                      disabled={!!busy}
                    >
                      <X size={16} />
                      {friend.incoming ? 'Decline' : 'Cancel'}
                    </button>
                  </>
                ) : (
                  <button
                    className="secondary-button"
                    onClick={() => action(friend.id, 'unblock')}
                    disabled={!!busy}
                  >
                    Unblock
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
