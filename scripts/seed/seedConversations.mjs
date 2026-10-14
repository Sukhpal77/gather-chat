import { Conversation, Message } from '../../src/lib/models.mjs';
import { pairKey } from '../../src/lib/validation.mjs';
import { conversations as fixtures } from './data/conversations.mjs';
import { SeedRecord } from './models/SeedRecord.mjs';

export async function seedConversations(users, counts) {
  const conversations = {};
  for (const fixture of fixtures) {
    const key = `conversation:${fixture.key}`;
    const marker = await SeedRecord.findById(key).lean();
    let conversation = marker && (await Conversation.findById(marker.documentId));
    if (!conversation && !marker && fixture.key === 'weekend') {
      // The original seeder had no group marker. Its stable message identifies
      // the same group even if its name or owner has since changed.
      const legacy = await Message.findOne({ sender: users.sam._id, clientId: 'demo:message:8' })
        .select('conversation')
        .lean();
      if (legacy)
        conversation = await Conversation.findOne({ _id: legacy.conversation, kind: 'group' });
    }
    if (!conversation && !marker) {
      const query =
        fixture.kind === 'direct'
          ? { directKey: pairKey(...fixture.members.map((name) => users[name]._id)) }
          : { kind: 'group', name: fixture.name, owner: users[fixture.owner]._id };
      conversation = await Conversation.findOne(query);
    }
    // A deleted sample conversation remains deleted on later runs.
    if (!conversation && marker) continue;
    if (!conversation) {
      const data = {
        kind: fixture.kind,
        name: fixture.name,
        description: fixture.description,
        owner: users[fixture.owner]._id,
      };
      for (const field of ['members', 'admins', 'pinnedBy', 'archivedBy', 'mutedBy'])
        data[field] = (fixture[field] || []).map((name) => users[name]._id);
      if (fixture.kind === 'direct') data.directKey = pairKey(...data.members);
      conversation = await Conversation.create(data);
      counts.conversations++;
    }
    conversations[fixture.key] = conversation;
    await SeedRecord.updateOne(
      { _id: key },
      { $setOnInsert: { documentId: conversation._id } },
      { upsert: true },
    );
  }
  return conversations;
}
