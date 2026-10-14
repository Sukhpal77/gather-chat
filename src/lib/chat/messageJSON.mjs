import { publicUser } from '../auth.mjs';
export function messageJSON(message) {
  return {
    id: String(message._id),
    conversationId: String(message.conversation),
    sender: message.sender?.name ? publicUser(message.sender) : { id: String(message.sender) },
    text: message.text,
    createdAt: message.createdAt,
    readBy: message.readBy.map(String),
    clientId: message.clientId,
    attachment: message.attachment?.name
      ? {
          id: String(message.attachment._id),
          name: message.attachment.name,
          mime: message.attachment.mime,
          size: message.attachment.size,
          url: `/api/files/${message.attachment._id}`,
        }
      : null,
  };
}
