import { json, readBody as body } from '@/server/http.mjs';

import bcrypt from 'bcryptjs';

import { User, Session } from '@/lib/models.mjs';
import { setSession } from '@/lib/auth.mjs';
import { ensure, passwordInput } from '@/lib/validation.mjs';

export async function changePassword(request, { user, id }) {
  const uid = user?._id;

  const input = await body(request);
  const password = passwordInput(input.password);
  const account = await User.findById(uid).select('+password');
  ensure(
    typeof input.currentPassword === 'string' &&
      (await bcrypt.compare(input.currentPassword, account.password)),
    'Current password is incorrect.',
    401,
  );
  account.password = await bcrypt.hash(password, 12);
  await account.save();
  await Session.deleteMany({ user: uid });
  globalThis.gatherIO?.in(`user:${uid}`).disconnectSockets(true);
  return setSession(json({ ok: true }), '', true);
}
