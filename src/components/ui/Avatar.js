import { initials } from '@/lib/format';
export default function Avatar({ person, size = 'medium', online, group = false }) {
  const hue = [...(person?.name || 'Gather')].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5;
  return (
    <span className={`avatar avatar-${size} avatar-color-${hue} ${group ? 'avatar-group' : ''}`}>
      {person?.avatar ? (
        <img src={person.avatar} alt="" />
      ) : (
        <span>{group ? '#' : initials(person?.name)}</span>
      )}
      {online !== undefined && <i className={`presence-dot ${online ? 'is-online' : ''}`} />}
    </span>
  );
}
