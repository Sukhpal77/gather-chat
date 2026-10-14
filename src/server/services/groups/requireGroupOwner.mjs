import { membership } from '@/lib/chat.mjs';
import { ensure } from '@/lib/validation.mjs';

export async function requireGroupOwner(id, userId) {
  const group = await membership(id, userId);
  ensure(group.kind === 'group', 'Group not found.', 404);
  ensure(String(group.owner) === String(userId), 'Only the group owner can do this.', 403);
  return group;
}
