import { Check, CheckCheck, Download, FileText } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { clockTime, fileSize } from '@/lib/format';

export default function MessageBubble({ message, own, group }) {
  const attachment = message.attachment;
  const read = message.readBy.some((id) => id !== message.sender.id);
  return (
    <div className={`message-row ${own ? 'own-message' : ''}`}>
      {!own && <Avatar person={message.sender} size="small" />}
      <div className="message-content">
        {group && !own && <span className="message-author">{message.sender.name}</span>}
        <div className="message-bubble">
          {attachment &&
            (attachment.mime.startsWith('image/') ? (
              <a href={attachment.url} target="_blank" rel="noreferrer">
                <img className="message-image" src={attachment.url} alt={attachment.name} />
              </a>
            ) : attachment.mime.startsWith('audio/') ? (
              <div className="voice-message">
                <audio controls preload="metadata" src={attachment.url} />
                <span>Voice message</span>
              </div>
            ) : (
              <a className="file-message" href={attachment.url} download={attachment.name}>
                <FileText size={25} />
                <span>
                  <strong>{attachment.name}</strong>
                  <small>{fileSize(attachment.size)}</small>
                </span>
                <Download size={18} />
              </a>
            ))}
          {message.text && <p>{message.text}</p>}
        </div>
        <div className="message-time">
          <time dateTime={message.createdAt}>{clockTime(message.createdAt)}</time>
          {own &&
            (read ? (
              <CheckCheck size={14} className="read-check" aria-label="Read" />
            ) : (
              <Check size={14} aria-label="Sent" />
            ))}
        </div>
      </div>
    </div>
  );
}
