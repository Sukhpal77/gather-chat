import {
  X,
  Users,
  LogOut,
  UserMinus,
  Ban,
  Settings,
  Pin,
  Archive,
  VolumeX,
  Volume2,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import SharedFiles from './SharedFiles';
export default function ConversationDetails({
  conversation,
  user,
  friends,
  onClose,
  onLeave,
  onRelationship,
  onManageGroup,
  onFlag,
}) {
  const person =
    conversation.kind === 'direct' ? conversation.members.find((m) => m.id !== user.id) : null;
  const relation = person && friends.find((friend) => friend.user.id === person.id);
  return (
    <aside className="details-panel">
      <header>
        <h3>Conversation details</h3>
        <button className="icon-button" onClick={onClose} aria-label="Close details">
          <X size={19} />
        </button>
      </header>
      <div className="details-person">
        <Avatar
          person={person || { name: conversation.name, avatar: conversation.avatar }}
          size="large"
          group={!person}
        />
        <h2>{conversation.name}</h2>
        <p>{person ? `@${person.username}` : `${conversation.members.length} members`}</p>
        {person?.bio && <blockquote>{person.bio}</blockquote>}
        {!person && conversation.description && <blockquote>{conversation.description}</blockquote>}
      </div>
      <div className="details-section">
        <h4>{person ? 'ABOUT' : 'YOUR CIRCLE'}</h4>
        {person ? (
          <p>{person.status || 'Available'}</p>
        ) : (
          conversation.members.map((member) => (
            <div className="member-row" key={member.id}>
              <Avatar person={member} size="small" />
              <span>
                {member.name}
                <small>
                  {member.id === conversation.ownerId
                    ? 'Owner'
                    : conversation.adminIds?.includes(member.id)
                      ? 'Admin'
                      : member.id === user.id
                        ? 'You'
                        : `@${member.username}`}
                </small>
              </span>
            </div>
          ))
        )}
      </div>
      <div className="details-section">
        <h4>MANAGE CONVERSATION</h4>
        {!person && (
          <button className="detail-action" onClick={onManageGroup}>
            <Settings size={17} />
            {user.id === conversation.ownerId || conversation.adminIds?.includes(user.id)
              ? 'Manage group'
              : 'View group members'}
          </button>
        )}
        <button className="detail-action" onClick={() => onFlag('pinned', !conversation.pinned)}>
          <Pin size={17} />
          {conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
        </button>
        <button className="detail-action" onClick={() => onFlag('muted', !conversation.muted)}>
          {conversation.muted ? <Volume2 size={17} /> : <VolumeX size={17} />}
          {conversation.muted ? 'Unmute conversation' : 'Mute conversation'}
        </button>
        <button
          className="detail-action"
          onClick={() => onFlag('archived', !conversation.archived)}
        >
          <Archive size={17} />
          {conversation.archived ? 'Restore conversation' : 'Archive conversation'}
        </button>
        {person && relation ? (
          <>
            <button className="danger-text" onClick={() => onRelationship(relation.id, 'remove')}>
              <UserMinus size={17} /> Remove friend
            </button>
            <button className="danger-text" onClick={() => onRelationship(relation.id, 'block')}>
              <Ban size={17} /> Block person
            </button>
          </>
        ) : (
          !person && (
            <button className="danger-text" onClick={onLeave}>
              <LogOut size={17} /> Leave group
            </button>
          )
        )}
      </div>
      <div className="details-section">
        <h4>SHARED FILES</h4>
        <SharedFiles conversation={conversation} />
      </div>
      <div className="details-bottom">
        <Users size={17} /> A small circle. A little closer.
      </div>
    </aside>
  );
}
