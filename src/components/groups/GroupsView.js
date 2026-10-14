import { Plus, ArrowUpRight, Users, Hash } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { recentTime } from '@/lib/format';
import GroupInvitationList from './GroupInvitationList';
export default function GroupsView({
  conversations,
  onCreate,
  onSelect,
  invitations,
  invitationBusy,
  onRespond,
}) {
  const groups = conversations.filter((c) => c.kind === 'group');
  return (
    <section className="feature-view">
      <header className="feature-header">
        <span className="eyebrow">BETTER TOGETHER</span>
        <h1>
          Small circles.
          <br />
          Big conversations<span>.</span>
        </h1>
        <p>A home for your shared plans, ideas, and everyday moments.</p>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={18} /> Create a group
        </button>
      </header>
      <GroupInvitationList invitations={invitations} busy={invitationBusy} onRespond={onRespond} />
      <div className="section-title">
        <h2>
          Your groups <span className="count-pill">{groups.length}</span>
        </h2>
        <span>Bring everyone into the conversation.</span>
      </div>
      {!groups.length ? (
        <EmptyState
          title="Make room for your circle"
          description="Create a group and invite your friends to talk together."
          icon={Users}
          action={
            <button className="primary-button" onClick={onCreate}>
              <Plus size={17} /> Create your first group
            </button>
          }
        />
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <button className="group-card" key={group.id} onClick={() => onSelect(group.id)}>
              <div className="group-card-top">
                <Avatar person={{ name: group.name, avatar: group.avatar }} group size="large" />
                <ArrowUpRight size={23} />
              </div>
              <span className="eyebrow">
                <Hash size={11} /> GROUP CONVERSATION
              </span>
              <h3>{group.name}</h3>
              <p>{group.description || 'A little space to keep everyone connected.'}</p>
              <div className="group-members">
                <span>
                  {group.members.slice(0, 4).map((person) => (
                    <Avatar key={person.id} person={person} size="tiny" />
                  ))}
                </span>
                <small>{group.members.length} members</small>
              </div>
              <footer>
                <span>{group.lastMessage || 'Be the first to say hello'}</span>
                <time>{recentTime(group.lastMessageAt)}</time>
              </footer>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
