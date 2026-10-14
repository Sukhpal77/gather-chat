import { passwordInput } from '../../src/lib/validation.mjs';
import { seedUsers } from './seedUsers.mjs';
import { seedFriendships } from './seedFriendships.mjs';
import { seedConversations } from './seedConversations.mjs';
import { seedAttachments } from './seedAttachments.mjs';
import { seedMessages } from './seedMessages.mjs';
import { seedInvitations } from './seedInvitations.mjs';

export async function runSeed(password) {
  passwordInput(password);
  const counts = {
    users: 0,
    friendships: 0,
    conversations: 0,
    attachments: 0,
    messages: 0,
    invitations: 0,
  };
  const users = await seedUsers(password, counts);
  await seedFriendships(users, counts);
  const conversations = await seedConversations(users, counts);
  const attachments = await seedAttachments(users, counts);
  await seedMessages(users, conversations, attachments, counts);
  await seedInvitations(users, conversations, counts);
  return counts;
}
