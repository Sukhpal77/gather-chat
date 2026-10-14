import { json } from '@/server/http.mjs';

import { publicUser } from '@/lib/auth.mjs';

export async function getProfile(request, { user }) {
  return json({ user: publicUser(user, true) });
}
