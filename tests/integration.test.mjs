import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { io } from 'socket.io-client';
import { importLegacyData } from '../scripts/migration/importLegacyData.mjs';

const base = 'http://127.0.0.1:3100';
const dbName = `gather_test_${randomUUID().replaceAll('-', '')}`;
const uri = `mongodb://127.0.0.1:27017/${dbName}`;
const sockets = [];
let server;
let output = '';

async function request(path, cookie = '', method = 'GET', body, expected = 200, origin) {
  const response = await fetch(base + '/api' + path, {
    method,
    headers: {
      cookie,
      ...(origin ? { origin } : {}),
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const value = await response.json();
  assert.equal(response.status, expected, JSON.stringify(value));
  return { value, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function register(username) {
  return request(
    '/auth/register',
    '',
    'POST',
    { name: username, username, email: `${username}@example.com`, password: 'ValidPassword123!' },
    201,
  );
}
async function socketFor(cookie) {
  const socket = io(base, {
    extraHeaders: { cookie },
    transports: ['websocket'],
    reconnection: false,
  });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}
function event(socket, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, listener);
      reject(new Error(`Missing ${name} event`));
    }, 8000);
    const listener = (value) => {
      clearTimeout(timer);
      resolve(value);
    };
    socket.once(name, listener);
  });
}

test(
  'full stack: sessions, friendship, authorized realtime chat, groups, files, and migration',
  { timeout: 120000 },
  async (t) => {
    server = spawn(process.execPath, ['server.mjs', '--production'], {
      env: { ...process.env, PORT: '3100', HOSTNAME: '127.0.0.1', MONGODB_URI: uri, APP_URL: base },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', (data) => {
      output += data;
    });
    server.stderr.on('data', (data) => {
      output += data;
    });
    t.after(async () => {
      for (const socket of sockets) socket.disconnect();
      server.kill();
      await mongoose.disconnect();
      const cleanup = await mongoose.createConnection(uri).asPromise();
      await cleanup.dropDatabase();
      await cleanup.close();
    });
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const response = await fetch(base + '/api/health');
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(ready, output);
    const alice = await register('alice');
    const bob = await register('bob');
    const carol = await register('carol');
    const aid = alice.value.user.id,
      bid = bob.value.user.id,
      cid = carol.value.user.id;
    let relationship, direct, group;

    await t.test('account validation, cookie session, login, and private profile', async () => {
      await request('/me', '', 'GET', undefined, 401);
      const me = await request('/me', alice.cookie);
      assert.equal(me.value.user.id, aid);
      assert.equal(me.value.user.password, undefined);
      const people = await request('/people', alice.cookie);
      assert.equal(people.value.people[0].email, undefined);
      await request('/auth/login', '', 'POST', { login: 'alice', password: 'wrong' }, 401);
      await request('/auth/login', '', 'POST', { login: 'alice', password: 'ValidPassword123!' });
      await request('/me', alice.cookie, 'PATCH', { name: 'bad' }, 403, 'https://evil.example');
      await request('/friends', alice.cookie, 'POST', { userId: { $ne: null } }, 400);
    });
    await t.test('only recipient accepts a request; duplicate pairs prevented', async () => {
      relationship = (await request('/friends', alice.cookie, 'POST', { userId: bid }, 201)).value
        .id;
      await request(`/friends/${relationship}`, alice.cookie, 'PATCH', { action: 'accept' }, 403);
      await request(`/friends/${relationship}`, carol.cookie, 'PATCH', { action: 'accept' }, 404);
      await request('/friends', bob.cookie, 'POST', { userId: aid }, 409);
      await request(`/friends/${relationship}`, bob.cookie, 'PATCH', { action: 'accept' });
      direct = (
        await request('/conversations', alice.cookie, 'POST', { kind: 'direct', userId: bid }, 201)
      ).value.id;
      const same = (
        await request('/conversations', bob.cookie, 'POST', { kind: 'direct', userId: aid }, 201)
      ).value.id;
      assert.equal(same, direct);
    });
    const asocket = await socketFor(alice.cookie);
    const bsocket = await socketFor(bob.cookie);
    await t.test('socket messages persist, broadcast, and remain idempotent', async () => {
      const incoming = event(bsocket, 'message:new');
      const result = await asocket.timeout(8000).emitWithAck('message:send', {
        conversationId: direct,
        text: 'Hello over WebSocket',
        clientId: 'socket-message',
      });
      assert.ok(result.message, JSON.stringify(result));
      assert.equal((await incoming).text, 'Hello over WebSocket');
      const duplicate = await asocket.timeout(8000).emitWithAck('message:send', {
        conversationId: direct,
        text: 'Hello over WebSocket',
        clientId: 'socket-message',
      });
      assert.equal(result.message.id, duplicate.message.id);
      const messages = (await request(`/conversations/${direct}/messages`, bob.cookie)).value
        .messages;
      assert.equal(messages.length, 1);
      assert.equal(messages[0].sender.id, aid);
      await request(`/conversations/${direct}/messages`, carol.cookie, 'GET', undefined, 404);
      const read = event(asocket, 'messages:read');
      await request(`/conversations/${direct}/read`, bob.cookie, 'POST', {
        messageId: messages[0].id,
      });
      assert.equal((await read).userId, bid);
      const broadcast = event(bsocket, 'message:new');
      await request(
        `/conversations/${direct}/messages`,
        alice.cookie,
        'POST',
        { text: 'HTTP fallback', clientId: 'http-message' },
        201,
      );
      assert.equal((await broadcast).text, 'HTTP fallback');
    });
    await t.test('typing is authorized and private', async () => {
      const typing = event(bsocket, 'typing');
      asocket.emit('typing', { conversationId: direct, active: true });
      assert.equal((await typing).userId, aid);
    });
    await t.test('uploads are private, persist in MongoDB, and support attachments', async () => {
      const form = new FormData();
      form.append('file', new File(['a private note'], 'note.txt', { type: 'text/plain' }));
      const file = (await request('/files', alice.cookie, 'POST', form, 201)).value.attachment;
      await request(`/files/${file.id}`, carol.cookie, 'GET', undefined, 403);
      await request(
        `/conversations/${direct}/messages`,
        alice.cookie,
        'POST',
        { attachmentId: file.id, clientId: 'file-message' },
        201,
      );
      const download = await fetch(base + file.url, { headers: { cookie: bob.cookie } });
      assert.equal(await download.text(), 'a private note');
      const bad = new FormData();
      bad.append('file', new File(['<script>bad</script>'], 'bad.html', { type: 'text/html' }));
      await request('/files', alice.cookie, 'POST', bad, 400);
    });
    await t.test('groups enforce membership, ownership, read receipts and leaving', async () => {
      group = (
        await request(
          '/conversations',
          alice.cookie,
          'POST',
          { kind: 'group', name: 'Test circle', memberIds: [bid] },
          201,
        )
      ).value.id;
      await request(`/conversations/${group}`, bob.cookie, 'PATCH', { name: 'not allowed' }, 403);
      await request(`/conversations/${group}`, alice.cookie, 'PATCH', {
        name: 'Our circle',
        pinned: true,
      });
      const message = (
        await request(
          `/conversations/${group}/messages`,
          bob.cookie,
          'POST',
          { text: 'Group hello', clientId: 'group-message' },
          201,
        )
      ).value.message;
      await request(`/conversations/${group}/read`, alice.cookie, 'POST', {
        messageId: message.id,
      });
      await request(`/conversations/${group}/leave`, bob.cookie, 'POST', {});
      await request(`/conversations/${group}/messages`, bob.cookie, 'GET', undefined, 404);
    });
    await t.test(
      'dedicated group services manage details, members, ownership, photos and private files',
      async () => {
        const friend = (await request('/friends', alice.cookie, 'POST', { userId: cid }, 201)).value
          .id;
        await request(`/friends/${friend}`, carol.cookie, 'PATCH', { action: 'accept' });
        await request(`/groups/${group}`, carol.cookie, 'PATCH', { name: 'Unauthorized' }, 404);
        await request(`/groups/${group}/members`, alice.cookie, 'POST', { memberIds: [bid, cid] });
        await request(`/groups/${group}/members`, bob.cookie, 'POST', { memberIds: [aid] }, 403);
        await request(
          `/groups/${group}`,
          bob.cookie,
          'PATCH',
          { description: 'Unauthorized' },
          403,
        );
        await request(`/groups/${group}`, alice.cookie, 'PATCH', {
          name: 'Managed circle',
          description: 'A real group service',
        });
        await request(`/groups/${group}/members`, alice.cookie, 'POST', { memberIds: [bid] }, 400);
        await request(`/groups/${group}/members/${aid}`, alice.cookie, 'DELETE', {}, 400);
        const form = new FormData();
        form.append(
          'file',
          new File(
            [
              Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6lZ8AAAAASUVORK5CYII=',
                'base64',
              ),
            ],
            'group.png',
            { type: 'image/png' },
          ),
        );
        const avatar = (await request('/files', alice.cookie, 'POST', form, 201)).value.attachment;
        await request(`/groups/${group}`, alice.cookie, 'PATCH', { avatar: avatar.url });
        const allowed = await fetch(base + avatar.url, { headers: { cookie: bob.cookie } });
        assert.equal(allowed.status, 200);
        await request(
          `/conversations/${group}/messages`,
          alice.cookie,
          'POST',
          { attachmentId: avatar.id, clientId: 'group-file' },
          201,
        );
        const files = (await request(`/conversations/${group}/files`, bob.cookie)).value.files;
        assert.equal(files[0].attachment.name, 'group.png');
        await request(`/groups/${group}/members/${cid}`, alice.cookie, 'DELETE', {});
        await request(`/conversations/${group}/files`, carol.cookie, 'GET', undefined, 404);
        await request(`/files/${avatar.id}`, carol.cookie, 'GET', undefined, 403);
        await request(`/groups/${group}/owner`, alice.cookie, 'POST', { userId: cid }, 409);
        await request(`/groups/${group}/owner`, alice.cookie, 'POST', { userId: bid });
        await request(`/groups/${group}`, alice.cookie, 'PATCH', { name: 'Old owner' }, 403);
        await request(`/groups/${group}`, bob.cookie, 'PATCH', { name: 'New owner circle' });
        await request(`/conversations/${group}`, alice.cookie, 'PATCH', { muted: true });
        const aliceList = (await request('/conversations', alice.cookie)).value.conversations;
        const bobList = (await request('/conversations', bob.cookie)).value.conversations;
        assert.equal(aliceList.find((c) => c.id === group).muted, true);
        assert.equal(bobList.find((c) => c.id === group).muted, false);
        assert.equal(bobList.find((c) => c.id === group).ownerId, bid);
      },
    );
    await t.test(
      'group admins and recipient-only invitations enforce role boundaries',
      async () => {
        await request(`/groups/${group}/members/${aid}/role`, bob.cookie, 'PATCH', {
          role: 'admin',
        });
        await request(`/groups/${group}`, alice.cookie, 'PATCH', {
          description: 'Edited by an admin',
        });
        await request(`/groups/${group}/members/${bid}`, alice.cookie, 'DELETE', {}, 403);
        await request(
          `/groups/${group}/members/${cid}/role`,
          alice.cookie,
          'PATCH',
          { role: 'admin' },
          403,
        );
        const inviteEvent = event(asocket, 'groups:invitations');
        await request(`/groups/${group}/invites`, alice.cookie, 'POST', { memberIds: [cid] });
        await inviteEvent;
        const pending = (await request('/group-invitations', carol.cookie)).value.invitations;
        assert.equal(pending.length, 1);
        assert.equal(pending[0].group.id, group);
        const inviteId = pending[0].id;
        await request(`/conversations/${group}/messages`, carol.cookie, 'GET', undefined, 404);
        await request(
          `/group-invitations/${inviteId}`,
          bob.cookie,
          'POST',
          { action: 'accept' },
          404,
        );
        await request(`/group-invitations/${inviteId}`, carol.cookie, 'POST', { action: 'accept' });
        await request(
          `/group-invitations/${inviteId}`,
          carol.cookie,
          'POST',
          { action: 'accept' },
          404,
        );
        await request(`/conversations/${group}/messages`, carol.cookie);
        assert.equal(
          (await request('/group-invitations', carol.cookie)).value.invitations.length,
          0,
        );
        await request(`/groups/${group}/members/${cid}/role`, bob.cookie, 'PATCH', {
          role: 'admin',
        });
        await request(`/groups/${group}/members/${cid}`, alice.cookie, 'DELETE', {}, 403);
        await request(`/groups/${group}/members/${cid}/role`, bob.cookie, 'PATCH', {
          role: 'member',
        });
        await request(`/groups/${group}/members/${cid}`, alice.cookie, 'DELETE', {});
        await request(`/groups/${group}/invites`, alice.cookie, 'POST', { memberIds: [cid] });
        const declineId = (await request('/group-invitations', carol.cookie)).value.invitations[0]
          .id;
        await request(`/group-invitations/${declineId}`, carol.cookie, 'POST', {
          action: 'decline',
        });
        await request(`/conversations/${group}/messages`, carol.cookie, 'GET', undefined, 404);
        await request(`/groups/${group}/invites`, alice.cookie, 'POST', { memberIds: [cid] });
        const cancelId = (await request(`/groups/${group}/invites`, bob.cookie)).value
          .invitations[0].id;
        await request(`/groups/${group}/invites/${cancelId}`, bob.cookie, 'DELETE', {});
        await request(
          `/group-invitations/${cancelId}`,
          carol.cookie,
          'POST',
          { action: 'accept' },
          404,
        );
        await request(`/groups/${group}/members/${aid}/role`, bob.cookie, 'PATCH', {
          role: 'member',
        });
        await request(`/groups/${group}`, alice.cookie, 'PATCH', { name: 'No longer admin' }, 403);
      },
    );
    await t.test('pagination and archive flag preserve message history', async () => {
      await mongoose.connect(uri);
      const { Message } = await import('../src/lib/models.mjs');
      await Message.insertMany(
        Array.from({ length: 55 }, (_, i) => ({
          conversation: direct,
          sender: aid,
          text: `History ${i}`,
          clientId: `page-${i}`,
          readBy: [aid],
        })),
      );
      const latest = (await request(`/conversations/${direct}/messages`, alice.cookie)).value;
      assert.equal(latest.messages.length, 50);
      assert.equal(latest.hasMore, true);
      const older = (
        await request(
          `/conversations/${direct}/messages?before=${latest.messages[0].id}`,
          alice.cookie,
        )
      ).value;
      assert.equal(older.messages.length, 8);
      assert.equal(older.hasMore, false);
      await request(`/conversations/${direct}`, alice.cookie, 'PATCH', { archived: true });
      const list = (await request('/conversations', alice.cookie)).value.conversations;
      assert.equal(list.find((c) => c.id === direct).archived, true);
    });
    await t.test('blocking stops HTTP and socket messages; only blocker unblocks', async () => {
      await request(`/friends/${relationship}`, alice.cookie, 'PATCH', { action: 'block' });
      await request(
        `/conversations/${direct}/messages`,
        bob.cookie,
        'POST',
        { text: 'blocked', clientId: 'blocked-http' },
        403,
      );
      const result = await bsocket.timeout(8000).emitWithAck('message:send', {
        conversationId: direct,
        text: 'blocked',
        clientId: 'blocked-socket',
      });
      assert.ok(result.error);
      await request(`/friends/${relationship}`, bob.cookie, 'DELETE', {}, 403);
      await request(`/friends/${relationship}`, alice.cookie, 'DELETE', {});
    });
    await t.test('profile preferences and logout invalidate socket sessions', async () => {
      const profile = (
        await request('/me', alice.cookie, 'PATCH', {
          bio: 'Updated bio',
          preferences: { theme: 'dark', sound: false },
        })
      ).value.user;
      assert.equal(profile.preferences.theme, 'dark');
      const disconnected = event(asocket, 'disconnect');
      await request('/auth/logout', alice.cookie, 'POST', {});
      await disconnected;
      await request('/me', alice.cookie, 'GET', undefined, 401);
    });
    await t.test(
      'password changes invalidate all sessions and reset tokens are single-use',
      async () => {
        await request(
          '/me/password',
          carol.cookie,
          'POST',
          { currentPassword: 'wrong', password: 'NewPassword123!' },
          401,
        );
        await request('/me/password', carol.cookie, 'POST', {
          currentPassword: 'ValidPassword123!',
          password: 'NewPassword123!',
        });
        await request('/me', carol.cookie, 'GET', undefined, 401);
        await request(
          '/auth/login',
          '',
          'POST',
          { login: 'carol', password: 'ValidPassword123!' },
          401,
        );
        const updated = await request('/auth/login', '', 'POST', {
          login: 'carol',
          password: 'NewPassword123!',
        });
        const { Reset } = await import('../src/lib/models.mjs');
        const { hashToken } = await import('../src/lib/auth.mjs');
        const token = randomUUID().replaceAll('-', '').repeat(2);
        await Reset.create({
          user: cid,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60000),
        });
        await request('/auth/reset', '', 'POST', { token, password: 'ResetPassword123!' });
        await request('/auth/reset', '', 'POST', { token, password: 'ResetPassword123!' }, 400);
        await request('/me', updated.cookie, 'GET', undefined, 401);
        await request('/auth/login', '', 'POST', { login: 'carol', password: 'ResetPassword123!' });
      },
    );
    await t.test('legacy PostgreSQL export imports idempotently with password hashes', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const fixture = {
        users: [
          {
            id: 'legacy-a',
            userName: 'old_alice',
            email: 'oldalice@example.com',
            firstName: 'Old',
            lastName: 'Alice',
            password: await bcrypt.hash('OldPassword123!', 10),
          },
          {
            id: 'legacy-b',
            userName: 'old_bob',
            email: 'oldbob@example.com',
            password: await bcrypt.hash('OldPassword123!', 10),
          },
        ],
        friends: [
          { id: 'old-friend', userId: 'legacy-a', friendId: 'legacy-b', status: 'accepted' },
        ],
        chats: [
          {
            id: 'old-message',
            senderId: 'legacy-a',
            receiverId: 'legacy-b',
            message: 'From PostgreSQL',
            isRead: true,
            createdAt: '2024-01-01T12:00:00Z',
          },
        ],
      };
      fixture.groups = [
        {
          id: 'legacy-group',
          name: 'Legacy admins',
          adminId: ['legacy-a', 'legacy-b'],
          membersId: ['legacy-a', 'legacy-b'],
          description: 'Preserved roles',
        },
      ];
      const first = await importLegacyData(fixture);
      assert.equal(first.users, 2);
      assert.equal(first.messages, 1);
      assert.equal(first.groups, 1);
      const { User, Conversation } = await import('../src/lib/models.mjs');
      const importedAdmin = await User.findOne({ legacyId: 'legacy-b' });
      const importedGroup = await Conversation.findOne({ kind: 'group', name: 'Legacy admins' });
      assert.equal(importedGroup.admins.map(String).includes(String(importedAdmin._id)), true);
      const again = await importLegacyData(fixture);
      assert.equal(again.users, 0);
      assert.equal(again.messages, 0);
      assert.equal(again.groups, 0);
      await request('/auth/login', '', 'POST', { login: 'old_alice', password: 'OldPassword123!' });
    });
  },
);
