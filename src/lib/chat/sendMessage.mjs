import { Conversation, Message, Attachment } from '../models.mjs';
import { ensure, objectId, text } from '../validation.mjs';
import { membership } from './membership.mjs';
import { messageJSON } from './messageJSON.mjs';
export async function sendMessage(userId, input) {
  const conversation = await membership(input.conversationId, userId);
  const content = input.text === undefined ? '' : text(input.text, 'Message', 4000, false);
  const clientId = text(input.clientId, 'Message identifier', 100);
  const existing = await Message.findOne({ sender: userId, clientId })
    .populate('sender')
    .populate('attachment');
  if (existing) {
    ensure(
      String(existing.conversation) === String(conversation._id),
      'Message identifier already used.',
    );
    return { message: messageJSON(existing), members: conversation.members, duplicate: true };
  }
  let attachment;
  if (input.attachmentId) {
    attachment = await Attachment.findOne({ _id: objectId(input.attachmentId), owner: userId });
    ensure(attachment, 'Attachment not found.', 404);
  }
  ensure(content || attachment, 'Write a message or attach a file.');
  let message;
  try {
    message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      text: content,
      attachment: attachment?._id,
      readBy: [userId],
      clientId,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await Message.findOne({ sender: userId, clientId })
      .populate('sender')
      .populate('attachment');
    ensure(
      duplicate && String(duplicate.conversation) === String(conversation._id),
      'Message identifier already used.',
    );
    return { message: messageJSON(duplicate), members: conversation.members, duplicate: true };
  }
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      lastMessage:
        content || (attachment.mime.startsWith('audio/') ? 'Voice message' : attachment.name),
      lastMessageAt: message.createdAt,
      $set: { archivedBy: [] },
    },
  );
  await message.populate(['sender', 'attachment']);
  return { message: messageJSON(message), members: conversation.members, duplicate: false };
}
