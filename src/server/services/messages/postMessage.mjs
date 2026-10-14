import { json, readBody as body } from '@/server/http.mjs';

import { limit } from '@/lib/auth.mjs';

import { membership, sendMessage, notifyMembers } from '@/lib/chat.mjs';

export async function postMessage(request, { user, id }) {
  const uid = user?._id;

  await membership(id, uid);

  await limit(`messages:${uid}`, 90, 1);
  const result = await sendMessage(uid, { ...(await body(request)), conversationId: id });
  if (!result.duplicate) notifyMembers(result.members, 'message:new', result.message);
  return json({ message: result.message }, 201);
}
