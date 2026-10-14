import { Message, Conversation } from '../../src/lib/models.mjs';
import { messages } from './data/messages.mjs';
import { SeedRecord } from './models/SeedRecord.mjs';

export async function seedMessages(users, conversations, attachments, counts) {
  const startedAt = Date.now();
  for (const [index, fixture] of messages.entries()) {
    const conversation = conversations[fixture.conversation];
    if (
      !conversation ||
      !conversation.members.some((id) => String(id) === String(users[fixture.sender]._id))
    )
      continue;
    const attachment = fixture.attachment && attachments[fixture.attachment];
    if (fixture.attachment && !attachment) continue;
    const key = `message:${fixture.key}`;
    const sender = users[fixture.sender]._id;
    const clientId = `demo:message:${fixture.key}`;
    if (await SeedRecord.exists({ _id: key })) continue;
    let message = await Message.findOne({ sender, clientId });
    if (!message) {
      const createdAt = new Date(startedAt - (messages.length - index) * 4 * 60000);
      const readBy = (fixture.readBy || [fixture.sender])
        .map((name) => users[name]._id)
        .filter((id) => conversation.members.some((member) => String(member) === String(id)));
      message = await Message.create({
        conversation: conversation._id,
        sender,
        text: fixture.text,
        attachment: attachment?._id,
        clientId,
        readBy,
        createdAt,
      });
      counts.messages++;
      await Conversation.updateOne(
        {
          _id: conversation._id,
          $or: [{ lastMessageAt: { $lte: createdAt } }, { lastMessage: '' }],
        },
        { lastMessage: fixture.text, lastMessageAt: createdAt },
      );
    }
    await SeedRecord.updateOne(
      { _id: key },
      { $setOnInsert: { documentId: message._id } },
      { upsert: true },
    );
  }
}
