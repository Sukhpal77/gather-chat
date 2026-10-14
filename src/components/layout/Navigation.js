import { MessageCircle, Users, Hash, Archive, Settings, LogOut } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
const items = [
  ['messages', MessageCircle, 'Messages'],
  ['friends', Users, 'Friends'],
  ['groups', Hash, 'Groups'],
  ['archive', Archive, 'Archived'],
];
export default function Navigation({
  view,
  onView,
  user,
  requestCount,
  groupInviteCount,
  onLogout,
}) {
  return (
    <nav className="nav-rail" aria-label="Main navigation">
      <a className="rail-brand" href="/" aria-label="Gather home">
        <MessageCircle size={25} fill="currentColor" />
      </a>
      <div className="nav-main">
        {items.map(([id, Icon, label]) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => onView(id)}
            title={label}
            aria-label={label}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={1.7} />
            <span>{label}</span>
            {id === 'friends' && requestCount > 0 && <i className="nav-badge">{requestCount}</i>}
            {id === 'groups' && groupInviteCount > 0 && (
              <i className="nav-badge">{groupInviteCount}</i>
            )}
          </button>
        ))}
      </div>
      <div className="nav-bottom">
        <button
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          title="Settings"
          aria-label="Settings"
          onClick={() => onView('settings')}
        >
          <Settings size={22} strokeWidth={1.7} />
          <span>Settings</span>
        </button>
        <button className="nav-item" title="Sign out" aria-label="Sign out" onClick={onLogout}>
          <LogOut size={20} strokeWidth={1.7} />
          <span>Sign out</span>
        </button>
        <button
          className="nav-profile"
          aria-label="Edit your profile"
          onClick={() => onView('settings')}
        >
          <Avatar person={user} size="small" online />
        </button>
      </div>
    </nav>
  );
}
