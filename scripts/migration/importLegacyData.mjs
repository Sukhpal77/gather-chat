import { User, Friendship, Conversation, Message, Attachment } from '../../src/lib/models.mjs';
import { ensure, pairKey } from '../../src/lib/validation.mjs';

/** Import the old Sequelize JSON export without touching the source PostgreSQL database. */
export async function importLegacyData(data) {
  ensure(
    Array.isArray(data.users) && Array.isArray(data.friends) && Array.isArray(data.chats),
    'Export must include users, friends, and chats arrays.',
  );
  for (const row of data.users)
    ensure(
      row.id && row.email && row.userName && /^\$2[aby]\$\d{2}\$/.test(row.password),
      `Invalid user export: ${row.id}. A bcrypt password hash is required.`,
    );
  const sourceIds = new Set(data.users.map((row) => String(row.id)));
  for (const row of data.friends)
    ensure(
      sourceIds.has(String(row.userId)) &&
        sourceIds.has(String(row.friendId)) &&
        row.userId !== row.friendId &&
        ['accepted', 'pending', 'blocked'].includes(row.status),
      `Invalid friendship: ${row.id}.`,
    );
  for (const row of data.chats)
    ensure(
      sourceIds.has(String(row.senderId)) && sourceIds.has(String(row.receiverId)),
      `Missing sender or receiver for message ${row.id}.`,
    );
  const ids = new Map();
  const counts = { users: 0, friendships: 0, messages: 0, groups: 0, uploadsSkipped: 0 };
  for (const row of data.users) {
    const existing = await User.findOne({
      $or: [
        { legacyId: String(row.id) },
        { email: row.email.toLowerCase() },
        { username: row.userName.toLowerCase() },
      ],
    });
    ensure(
      !existing || existing.legacyId === String(row.id),
      `Account conflict for ${row.email}; resolve it before importing.`,
    );
    const user =
      existing ||
      (await User.create({
        legacyId: String(row.id),
        name: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.userName,
        username: row.userName.toLowerCase(),
        email: row.email.toLowerCase(),
        password: row.password,
        bio: row.bio || '',
        mobile: row.mobile || '',
        address: row.address || '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    ids.set(String(row.id), user._id);
    if (!existing) counts.users++;
    if (row.profile) counts.uploadsSkipped++;
  }
  for (const row of data.friends) {
    const from = ids.get(String(row.userId));
    const to = ids.get(String(row.friendId));
    const result = await Friendship.updateOne(
      { pair: pairKey(from, to) },
      {
        $setOnInsert: {
          from,
          to,
          status: row.status,
          ...(row.status === 'blocked' ? { blockedBy: from } : {}),
          createdAt: row.createdAt,
        },
      },
      { upsert: true },
    );
    counts.friendships += result.upsertedCount;
  }
  for (const row of [...data.chats].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
    if (await Message.exists({ legacyId: String(row.id) })) continue;
    const sender = ids.get(String(row.senderId));
    const receiver = ids.get(String(row.receiverId));
    const conversation = await Conversation.findOneAndUpdate(
      { directKey: pairKey(sender, receiver) },
      { $setOnInsert: { kind: 'direct', members: [sender, receiver], owner: sender } },
      { upsert: true, new: true },
    );
    let attachment;
    const file = data.attachments?.find((file) => file.messageId === row.id);
    if (file?.base64) {
      const buffer = Buffer.from(file.base64, 'base64');
      ensure(buffer.length <= 8 * 1024 * 1024, `Attachment for ${row.id} exceeds 8 MB.`);
      attachment = await Attachment.create({
        owner: sender,
        name: file.name,
        mime: file.mime,
        size: buffer.length,
        data: buffer,
      });
    }
    if (row.voiceMail && !attachment) counts.uploadsSkipped++;
    const content =
      row.message ||
      (row.voiceMail && !attachment ? '[Legacy voice recording: file not included in export]' : '');
    const message = await Message.create({
      legacyId: String(row.id),
      conversation: conversation._id,
      sender,
      text: content,
      attachment: attachment?._id,
      clientId: `legacy:${row.id}`,
      readBy: row.isRead ? [sender, receiver] : [sender],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    if (
      new Date(message.createdAt) >= new Date(conversation.lastMessageAt) ||
      !conversation.lastMessage
    )
      await Conversation.updateOne(
        { _id: conversation._id },
        { lastMessage: content || file?.name || 'Attachment', lastMessageAt: message.createdAt },
      );
    counts.messages++;
  }
  for (const row of data.groups || []) {
    const owner = ids.get(String(Array.isArray(row.adminId) ? row.adminId[0] : row.adminId));
    ensure(owner, `Missing owner for group ${row.id}.`);
    const admins = (Array.isArray(row.adminId) ? row.adminId : [row.adminId])
      .map((id) => ids.get(String(id)))
      .filter((id) => id && String(id) !== String(owner));
    const members = [
      ...new Set([
        String(owner),
        ...admins.map(String),
        ...(row.membersId || []).map((id) => String(ids.get(String(id)) || '')).filter(Boolean),
      ]),
    ];
    const result = await Conversation.updateOne(
      { kind: 'group', name: row.name, owner },
      {
        $setOnInsert: {
          members,
          admins,
          description: row.description || '',
          createdAt: row.createdAt,
        },
      },
      { upsert: true },
    );
    counts.groups += result.upsertedCount;
  }
  return counts;
}
