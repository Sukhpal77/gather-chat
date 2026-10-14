import { membership } from '@/lib/chat.mjs';
import { ensure } from '@/lib/validation.mjs';
export function groupManagerQuery(id, userId) {
  return { _id: id, members: userId, $or: [{ owner: userId }, { admins: userId }] };
}
export async function requireGroupManager(id, userId) {
  const group = await membership(id, userId);
  ensure(group.kind === 'group', 'Group not found.', 404);
  ensure(
    String(group.owner) === String(userId) ||
      (group.admins || []).some((admin) => String(admin) === String(userId)),
    'Only group owners and admins can do this.',
    403,
  );
  return group;
}
