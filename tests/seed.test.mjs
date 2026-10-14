import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { runSeed } from '../scripts/seed/runSeed.mjs';
import {
  User,
  Friendship,
  Conversation,
  Message,
  Attachment,
  GroupInvitation,
} from '../src/lib/models.mjs';
import { pairKey } from '../src/lib/validation.mjs';

test(
  'complete demo seed is repeatable and preserves edits and answered invitations',
  { timeout: 60000 },
  async (t) => {
    const dbName = `gather_seed_test_${randomUUID().replaceAll('-', '')}`;
    await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, {
      serverSelectionTimeoutMS: 5000,
    });
    t.after(async () => {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    });
    const first = await runSeed('SeedPassword123!');
    assert.deepEqual(first, {
      users: 6,
      friendships: 10,
      conversations: 7,
      attachments: 3,
      messages: 23,
      invitations: 2,
    });
    const second = await runSeed('AnotherPassword123!');
    assert.deepEqual(second, {
      users: 0,
      friendships: 0,
      conversations: 0,
      attachments: 0,
      messages: 0,
      invitations: 0,
    });
    const jamie = await User.findOne({ username: 'jamie' }).select('+password');
    const alex = await User.findOne({ username: 'alex' });
    const priya = await User.findOne({ username: 'priya' });
    assert.equal(await bcrypt.compare('SeedPassword123!', jamie.password), true);
    assert.equal(await bcrypt.compare('AnotherPassword123!', jamie.password), false);
    const group = await Conversation.findOne({ name: 'The weekend crew' });
    assert.equal(String(group.owner), String(jamie._id));
    assert.deepEqual(group.admins.map(String), [String(alex._id)]);
    const invite = await GroupInvitation.findOne({ group: group._id, to: priya._id });
    assert.ok(invite);
    assert.ok(invite.expiresAt > new Date());
    const audio = await Attachment.findOne({ mime: 'audio/wav' }).select('+data');
    assert.equal(audio.data.subarray(0, 4).toString(), 'RIFF');
    assert.equal(audio.data.length, audio.size);
    const image = await Attachment.findOne({ mime: 'image/png' }).select('+data');
    assert.equal(image.data.subarray(1, 4).toString(), 'PNG');
    assert.ok(image.size < 8 * 1024 * 1024);

    await User.updateOne({ _id: jamie._id }, { bio: 'A profile edited in the app.' });
    await Conversation.updateOne(
      { _id: group._id },
      { name: 'My renamed group', owner: alex._id, admins: [] },
    );
    await GroupInvitation.deleteOne({ _id: invite._id });
    await Friendship.deleteOne({ pair: pairKey(jamie._id, alex._id) });
    const deleted = await Message.findOne({ clientId: 'demo:message:0' });
    await Message.deleteOne({ _id: deleted._id });
    const liveAt = new Date(Date.now() + 1000);
    await Conversation.updateOne(
      { _id: group._id },
      { lastMessage: 'New live conversation preview', lastMessageAt: liveAt },
    );
    const third = await runSeed('AnotherPassword123!');
    assert.deepEqual(third, {
      users: 0,
      friendships: 0,
      conversations: 0,
      attachments: 0,
      messages: 0,
      invitations: 0,
    });
    assert.equal((await User.findById(jamie._id)).bio, 'A profile edited in the app.');
    const kept = await Conversation.findById(group._id);
    assert.equal(kept.name, 'My renamed group');
    assert.equal(String(kept.owner), String(alex._id));
    assert.equal(kept.lastMessage, 'New live conversation preview');
    assert.equal(await GroupInvitation.countDocuments({ group: group._id, to: priya._id }), 0);
    assert.equal(await Message.countDocuments({ sender: alex._id, clientId: 'demo:message:0' }), 0);
    assert.equal(await Friendship.countDocuments({ pair: pairKey(jamie._id, alex._id) }), 0);
  },
);

test('non-demo collisions stop before inserting any demo users', { timeout: 30000 }, async (t) => {
  const dbName = `gather_seed_conflict_${randomUUID().replaceAll('-', '')}`;
  await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await User.create({
    name: 'An existing person',
    username: 'casey',
    email: 'existing@example.com',
    password: await bcrypt.hash('ExistingPassword123!', 10),
  });
  await assert.rejects(() => runSeed('SeedPassword123!'), /conflict/);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(await Conversation.countDocuments(), 0);
});

test(
  'original demo data is adopted without duplicating a renamed group or its messages',
  { timeout: 30000 },
  async (t) => {
    const dbName = `gather_seed_legacy_${randomUUID().replaceAll('-', '')}`;
    await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, {
      serverSelectionTimeoutMS: 5000,
    });
    t.after(async () => {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    });
    const hash = await bcrypt.hash('OriginalPassword123!', 10);
    const jamie = await User.create({
      name: 'Jamie Lee',
      username: 'jamie',
      email: 'jamie@example.com',
      password: hash,
      legacyId: 'demo:jamie',
    });
    const sam = await User.create({
      name: 'Sam Chen',
      username: 'sam',
      email: 'sam@example.com',
      password: hash,
      legacyId: 'demo:sam',
    });
    const group = await Conversation.create({
      kind: 'group',
      name: 'Already renamed',
      owner: sam._id,
      members: [jamie._id, sam._id],
      lastMessage: 'Keep this preview',
      lastMessageAt: new Date(Date.now() + 1000),
    });
    await Message.create({
      conversation: group._id,
      sender: sam._id,
      text: 'An edited original seed message',
      clientId: 'demo:message:8',
      readBy: [sam._id],
    });
    await runSeed('SeedPassword123!');
    assert.equal(await Conversation.countDocuments({ kind: 'group' }), 3);
    assert.equal(await Message.countDocuments({ sender: sam._id, clientId: 'demo:message:8' }), 1);
    const preserved = await Conversation.findById(group._id);
    assert.equal(preserved.name, 'Already renamed');
    assert.equal(String(preserved.owner), String(sam._id));
    assert.equal(preserved.lastMessage, 'Keep this preview');
  },
);
