import { MessageCircle } from 'lucide-react';
export default function EmptyState({ title, description, action, icon: Icon = MessageCircle }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={30} strokeWidth={1.5} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
